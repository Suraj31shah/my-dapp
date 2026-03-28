// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract TicketNFT is ERC721URIStorage, Ownable, ERC2981 {
    uint256 private _nextTokenId;

    struct Event {
        address organizer;
        string name;
        uint256 price;
        uint256 maxSupply;
        uint256 ticketsMinted;
        bool exists;
    }

    struct ResaleListing {
        uint256 price;
        address seller;
        bool isListed;
    }

    // Event ID => Event details
    mapping(uint256 => Event) public events;
    uint256 public nextEventId;

    // Token ID => Ticket Event ID
    mapping(uint256 => uint256) public ticketEvents;

    // Token ID => Used status
    mapping(uint256 => bool) public ticketUsed;

    // Token ID => ResaleListing
    mapping(uint256 => ResaleListing) public resaleListings;

    // Events
    event EventCreated(uint256 indexed eventId, address indexed organizer, string name, uint256 price, uint256 maxSupply);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address indexed buyer, string tokenURI);
    event TicketListed(uint256 indexed tokenId, uint256 price, address indexed seller);
    event TicketResold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event TicketUsed(uint256 indexed tokenId);
    event ResaleCancelled(uint256 indexed tokenId, address indexed seller);

    constructor() ERC721("TicketShield", "TSNFT") Ownable(msg.sender) {
        // Set default royalty of 10% (1000 basis points)
        _setDefaultRoyalty(msg.sender, 1000);
    }

    /**
     * @dev Create a new event
     */
    function createEvent(string memory _name, uint256 _price, uint256 _maxSupply) external returns (uint256) {
        uint256 eventId = nextEventId++;
        
        events[eventId] = Event({
            organizer: msg.sender,
            name: _name,
            price: _price,
            maxSupply: _maxSupply,
            ticketsMinted: 0,
            exists: true
        });

        emit EventCreated(eventId, msg.sender, _name, _price, _maxSupply);
        return eventId;
    }

    /**
     * @dev Buy a primary ticket from an event
     */
    function buyTicket(uint256 _eventId, string memory _tokenURI) external payable returns (uint256) {
        Event storage evt = events[_eventId];
        require(evt.exists, "Event does not exist");
        require(evt.ticketsMinted < evt.maxSupply, "Event is sold out");
        require(msg.value >= evt.price, "Insufficient payment");

        uint256 tokenId = _nextTokenId++;
        evt.ticketsMinted++;
        ticketEvents[tokenId] = _eventId;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        // Send payment to organizer
        if (evt.price > 0) {
            (bool success, ) = payable(evt.organizer).call{value: evt.price}("");
            require(success, "Transfer to organizer failed");
        }

        // Refund excess
        if (msg.value > evt.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - evt.price}("");
            require(refundSuccess, "Refund failed");
        }

        emit TicketMinted(tokenId, _eventId, msg.sender, _tokenURI);
        return tokenId;
    }

    /**
     * @dev List a ticket for resale. Max price is 150% of the original event price.
     */
    function listForResale(uint256 _tokenId, uint256 _price) external {
        require(ownerOf(_tokenId) == msg.sender, "Not the owner");
        require(!ticketUsed[_tokenId], "Ticket already used");

        uint256 eventId = ticketEvents[_tokenId];
        Event memory evt = events[eventId];

        uint256 maxPrice = (evt.price * 150) / 100;
        require(_price <= maxPrice, "Price exceeds 150% cap");

        resaleListings[_tokenId] = ResaleListing({
            price: _price,
            seller: msg.sender,
            isListed: true
        });

        emit TicketListed(_tokenId, _price, msg.sender);
    }

    /**
     * @dev Withdraw a resale listing
     */
    function cancelResale(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == msg.sender || resaleListings[_tokenId].seller == msg.sender, "Not authorized");
        delete resaleListings[_tokenId];
        emit ResaleCancelled(_tokenId, msg.sender);
    }

    /**
     * @dev Buy a ticket from the secondary market
     */
    function buyResaleTicket(uint256 _tokenId) external payable {
        ResaleListing memory listing = resaleListings[_tokenId];
        require(listing.isListed, "Ticket not listed for resale");
        require(msg.value >= listing.price, "Insufficient payment");

        address currentOwner = ownerOf(_tokenId);
        require(listing.seller == currentOwner, "Listing invalidated by transfer");

        uint256 eventId = ticketEvents[_tokenId];
        Event memory evt = events[eventId];

        // Royalty: 10%
        uint256 royaltyAmount = (listing.price * 1000) / 10000;
        uint256 sellerAmount = listing.price - royaltyAmount;

        delete resaleListings[_tokenId];

        _transfer(currentOwner, msg.sender, _tokenId);

        if (sellerAmount > 0) {
            (bool sellerSuccess, ) = payable(currentOwner).call{value: sellerAmount}("");
            require(sellerSuccess, "Transfer to seller failed");
        }

        if (royaltyAmount > 0) {
            (bool orgSuccess, ) = payable(evt.organizer).call{value: royaltyAmount}("");
            require(orgSuccess, "Transfer to organizer failed");
        }

        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
        }

        emit TicketResold(_tokenId, currentOwner, msg.sender, listing.price);
    }

    /**
     * @dev Specific override for ERC2981 using the event organizer.
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice) public view override returns (address, uint256) {
        uint256 eventId = ticketEvents[tokenId];
        address organizer = events[eventId].organizer;
        // Default 10%
        uint256 royaltyAmount = (salePrice * 1000) / 10000;
        
        if (organizer == address(0)) {
            return super.royaltyInfo(tokenId, salePrice);
        }
        return (organizer, royaltyAmount);
    }

    /**
     * @dev Mark ticket as used (only by organizer)
     */
    function markAsUsed(uint256 _tokenId) external {
        uint256 eventId = ticketEvents[_tokenId];
        require(events[eventId].organizer == msg.sender, "Only organizer can scan");
        require(!ticketUsed[_tokenId], "Ticket already used");

        ticketUsed[_tokenId] = true;
        
        // Remove from resale if listed
        if (resaleListings[_tokenId].isListed) {
            delete resaleListings[_tokenId];
        }

        emit TicketUsed(_tokenId);
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address previousOwner = super._update(to, tokenId, auth);
        if (previousOwner != address(0) && to != address(0)) {
            if (resaleListings[tokenId].isListed) {
                delete resaleListings[tokenId];
            }
        }
        return previousOwner;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
