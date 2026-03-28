extern crate alloc;

// Modules and imports
mod erc721;
mod ticket_platform;

/// Import the Stylus SDK along with alloy primitive types for use in our program.
use stylus_sdk::{
    abi::Bytes,
    call::Call,
    contract,
    msg,
    prelude::*,
    alloy_primitives::{Address, U256}
};
use alloy_sol_types::sol;
use crate::erc721::{Erc721, Erc721Params};
use crate::ticket_platform::{TicketPlatform, TicketParams};

struct TicketShieldParams;

/// Immutable definitions for the NFT part of the platform
impl TicketParams for TicketShieldParams {
    const NAME: &'static str = "TicketShield NFT";
    const SYMBOL: &'static str = "TSN";
}

// Define the entrypoint as a Solidity storage object.
sol_storage! {
    #[entrypoint]
    struct TicketShield {
        #[borrow]
        TicketPlatform<TicketShieldParams> platform;
    }
}

#[public]
#[inherit(TicketPlatform<TicketShieldParams>)]
impl TicketShield {
    /// Initialize the platform (e.g., set royalty)
    pub fn init(&mut self, royalty_bps: U256) -> Result<(), Vec<u8>> {
        self.platform.init(royalty_bps).map_err(|e| e.into())
    }

    /// Create a new event
    pub fn create_event(&mut self, price: U256, max_supply: U256) -> Result<U256, Vec<u8>> {
        self.platform.create_event(price, max_supply).map_err(|e| e.into())
    }

    /// Purchase a ticket for an event
    #[payable]
    pub fn buy_ticket(&mut self, event_id: U256) -> Result<U256, Vec<u8>> {
        self.platform.buy_ticket(event_id).map_err(|e| e.into())
    }

    /// List a ticket for resale
    pub fn list_ticket(&mut self, token_id: U256, price: U256) -> Result<(), Vec<u8>> {
        self.platform.list_ticket(token_id, price).map_err(|e| e.into())
    }

    /// Buy a ticket from the secondary market
    #[payable]
    pub fn buy_resale(&mut self, token_id: U256) -> Result<(), Vec<u8>> {
        self.platform.buy_resale(token_id).map_err(|e| e.into())
    }

    /// Verify and use a ticket (entry check)
    pub fn verify_ticket(&mut self, token_id: U256) -> Result<(), Vec<u8>> {
        self.platform.verify_ticket(token_id).map_err(|e| e.into())
    }

    /// Get event info
    pub fn get_event(&self, event_id: U256) -> Result<(Address, U256, U256, U256), Vec<u8>> {
        self.platform.get_event(event_id).map_err(|e| e.into())
    }

    /// Get ticket status (event_id, is_used)
    pub fn get_ticket_status(&self, token_id: U256) -> Result<(U256, bool), Vec<u8>> {
        self.platform.get_ticket_status(token_id).map_err(|e| e.into())
    }
}