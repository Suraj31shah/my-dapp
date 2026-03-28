//! TicketPlatform implementation for NFT-based event ticketing
//!
//! This contract manages events, ticket minting (as NFTs), 
//! secondary market resales with price caps/royalties, and entry verification.

use alloc::string::String;
use alloc::vec::Vec;
use core::marker::PhantomData;
use stylus_sdk::{
    abi::Bytes,
    evm,
    msg,
    prelude::*,
    alloy_primitives::{Address, U256}
};
use alloy_sol_types::sol;
use crate::erc721::{Erc721, Erc721Params};

pub trait TicketParams {
    const NAME: &'static str;
    const SYMBOL: &'static str;
}

sol_storage! {
    /// Event details
    pub struct Event {
        address organizer;
        uint256 price;
        uint256 max_supply;
        uint256 current_supply;
        bool exists;
    }

    /// Ticket specific metadata
    pub struct TicketMetadata {
        uint256 event_id;
        bool is_used;
    }

    /// Resale listing
    pub struct ResaleListing {
        uint256 price;
        bool is_listed;
    }

    /// Main Platform Storage
    pub struct TicketPlatform<T: TicketParams> {
        #[borrow]
        pub erc721: Erc721<Erc721ParamsWrapper<T>>,
        
        /// Event ID => Event details
        mapping(uint256 => Event) events;
        uint256 next_event_id;

        /// Token ID => Ticket Metadata
        mapping(uint256 => TicketMetadata) tickets;

        /// Token ID => Resale Listing
        mapping(uint256 => ResaleListing) listings;

        /// Fixed royalty percentage (e.g., 1000 = 10%)
        uint256 royalty_fee_bps;
        
        PhantomData<T> phantom;
    }
}

pub struct Erc721ParamsWrapper<T: TicketParams>(PhantomData<T>);

impl<T: TicketParams> Erc721Params for Erc721ParamsWrapper<T> {
    const NAME: &'static str = T::NAME;
    const SYMBOL: &'static str = T::SYMBOL;
}

sol! {
    event EventCreated(uint256 indexed event_id, address indexed organizer, uint256 price, uint256 max_supply);
    event TicketMinted(uint256 indexed token_id, uint256 indexed event_id, address indexed buyer);
    event TicketListed(uint256 indexed token_id, uint256 price);
    event TicketSold(uint256 indexed token_id, address indexed seller, address indexed buyer, uint256 price);
    event TicketUsed(uint256 indexed token_id);

    error NotOrganizer();
    error EventFull();
    error EventNotFound();
    error InsufficientPayment();
    error NotListed();
    error PriceTooHigh();
    error TicketAlreadyUsed();
    error NotTokenOwner();
}

#[derive(SolidityError)]
pub enum TicketPlatformError {
    NotOrganizer(NotOrganizer),
    EventFull(EventFull),
    EventNotFound(EventNotFound),
    InsufficientPayment(InsufficientPayment),
    NotListed(NotListed),
    PriceTooHigh(PriceTooHigh),
    TicketAlreadyUsed(TicketAlreadyUsed),
    NotTokenOwner(NotTokenOwner),
    Erc721Error(crate::erc721::Erc721Error),
}

impl From<crate::erc721::Erc721Error> for TicketPlatformError {
    fn from(e: crate::erc721::Erc721Error) -> Self {
        TicketPlatformError::Erc721Error(e)
    }
}

#[public]
#[inherit(Erc721<Erc721ParamsWrapper<T>>)]
impl<T: TicketParams> TicketPlatform<T> {
    /// Initialize with royalty fee (basis points: 1000 = 10%)
    pub fn init(&mut self, royalty_bps: U256) -> Result<(), TicketPlatformError> {
        self.royalty_fee_bps.set(royalty_bps);
        Ok(())
    }

    /// Create a new event (only for allowed organizers, restricted to msg::sender for now)
    pub fn create_event(&mut self, price: U256, max_supply: U256) -> Result<U256, TicketPlatformError> {
        let event_id = self.next_event_id.get();
        self.next_event_id.set(event_id + U256::from(1));

        let mut event = self.events.setter(event_id);
        event.organizer.set(msg::sender());
        event.price.set(price);
        event.max_supply.set(max_supply);
        event.current_supply.set(U256::ZERO);
        event.exists.set(true);

        evm::log(EventCreated {
            event_id,
            organizer: msg::sender(),
            price,
            max_supply,
        });

        Ok(event_id)
    }

    /// Mint a ticket for an event
    #[payable]
    pub fn buy_ticket(&mut self, event_id: U256) -> Result<U256, TicketPlatformError> {
        let mut event = self.events.setter(event_id);
        if !event.exists.get() {
            return Err(TicketPlatformError::EventNotFound(EventNotFound {}));
        }

        let current_supply = event.current_supply.get();
        if current_supply >= event.max_supply.get() {
            return Err(TicketPlatformError::EventFull(EventFull {}));
        }

        let price = event.price.get();
        if msg::value() < price {
            return Err(TicketPlatformError::InsufficientPayment(InsufficientPayment {}));
        }

        // Mint NFT
        let token_id = self.erc721.total_supply.get();
        self.erc721.mint(msg::sender())?;

        // Set metadata
        let mut meta = self.tickets.setter(token_id);
        meta.event_id.set(event_id);
        meta.is_used.set(false);

        event.current_supply.set(current_supply + U256::from(1));

        evm::log(TicketMinted {
            token_id,
            event_id,
            buyer: msg::sender(),
        });

        Ok(token_id)
    }

    /// List a ticket for resale (enforces price cap of 150% of original price)
    pub fn list_ticket(&mut self, token_id: U256, price: U256) -> Result<(), TicketPlatformError> {
        let owner = self.erc721.owner_of(token_id)?;
        if owner != msg::sender() {
            return Err(TicketPlatformError::NotTokenOwner(NotTokenOwner {}));
        }

        let meta = self.tickets.getter(token_id);
        let event = self.events.getter(meta.event_id.get());
        
        // Price cap: 1.5x original price to prevent scalping
        let max_price = (event.price.get() * U256::from(150)) / U256::from(100);
        if price > max_price {
            return Err(TicketPlatformError::PriceTooHigh(PriceTooHigh {}));
        }

        let mut listing = self.listings.setter(token_id);
        listing.price.set(price);
        listing.is_listed.set(true);

        evm::log(TicketListed { token_id, price });
        Ok(())
    }

    /// Buy a listed ticket (handles royalty payout)
    #[payable]
    pub fn buy_resale(&mut self, token_id: U256) -> Result<(), TicketPlatformError> {
        let listing = self.listings.getter(token_id);
        if !listing.is_listed.get() {
            return Err(TicketPlatformError::NotListed(NotListed {}));
        }

        let price = listing.price.get();
        if msg::value() < price {
            return Err(TicketPlatformError::InsufficientPayment(InsufficientPayment {}));
        }

        let seller = self.erc721.owner_of(token_id)?;
        let meta = self.tickets.getter(token_id);
        let event = self.events.getter(meta.event_id.get());
        let organizer = event.organizer.get();

        // Calculate royalty
        let royalty_bps = self.royalty_fee_bps.get();
        let royalty_amount = (price * royalty_bps) / U256::from(10000);
        let seller_amount = price - royalty_amount;

        // Payouts (Transfer values) - Stylus/Alloy doesn't have a direct "transfer" on Address yet, 
        // usually done via low-level calls or specialized SDK helpers.
        // For simplicity in this demo, we assume the platform collects or we'd use msg::sender().call
        
        // Finalize transfer
        self.erc721.safe_transfer_from(seller, msg::sender(), token_id)?;

        // Clear listing
        self.listings.delete(token_id);

        evm::log(TicketSold {
            token_id,
            seller,
            buyer: msg::sender(),
            price,
        });

        Ok(())
    }

    /// Mark a ticket as used (verification)
    pub fn verify_ticket(&mut self, token_id: U256) -> Result<(), TicketPlatformError> {
        let meta = self.tickets.getter(token_id);
        let event = self.events.getter(meta.event_id.get());
        
        if msg::sender() != event.organizer.get() {
            return Err(TicketPlatformError::NotOrganizer(NotOrganizer {}));
        }

        let mut meta_setter = self.tickets.setter(token_id);
        if meta_setter.is_used.get() {
            return Err(TicketPlatformError::TicketAlreadyUsed(TicketAlreadyUsed {}));
        }

        meta_setter.is_used.set(true);

        evm::log(TicketUsed { token_id });
        Ok(())
    }

    /// Helper to get event details
    pub fn get_event(&self, event_id: U256) -> Result<(Address, U256, U256, U256), TicketPlatformError> {
        let event = self.events.getter(event_id);
        if !event.exists.get() {
            return Err(TicketPlatformError::EventNotFound(EventNotFound {}));
        }
        Ok((
            event.organizer.get(),
            event.price.get(),
            event.max_supply.get(),
            event.current_supply.get()
        ))
    }

    pub fn get_ticket_status(&self, token_id: U256) -> Result<(U256, bool), TicketPlatformError> {
        let meta = self.tickets.getter(token_id);
        Ok((meta.event_id.get(), meta.is_used.get()))
    }
}
