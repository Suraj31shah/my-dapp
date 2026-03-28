const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TicketNFT", function () {
  let TicketNFT;
  let ticketNFT;
  let owner, organizer, buyer1, buyer2;
  const price = ethers.parseEther("0.1");
  const maxSupply = 10;
  const tokenURI = "ipfs://QmTest";

  beforeEach(async function () {
    [owner, organizer, buyer1, buyer2] = await ethers.getSigners();
    TicketNFT = await ethers.getContractFactory("TicketNFT");
    ticketNFT = await TicketNFT.deploy();
    await ticketNFT.waitForDeployment();
  });

  describe("Event Creation & Minting", function () {
    it("Should allow a user to create an event", async function () {
      await expect(ticketNFT.connect(organizer).createEvent("Web3 Summit", price, maxSupply))
        .to.emit(ticketNFT, "EventCreated")
        .withArgs(0, organizer.address, "Web3 Summit", price, maxSupply);

      const evt = await ticketNFT.events(0);
      expect(evt.name).to.equal("Web3 Summit");
      expect(evt.organizer).to.equal(organizer.address);
      expect(evt.maxSupply).to.equal(maxSupply);
    });

    it("Should allow a user to buy a ticket, increasing minted count", async function () {
      await ticketNFT.connect(organizer).createEvent("Web3 Summit", price, maxSupply);
      
      const initialBalance = await ethers.provider.getBalance(organizer.address);

      await expect(ticketNFT.connect(buyer1).buyTicket(0, tokenURI, { value: price }))
        .to.emit(ticketNFT, "TicketMinted")
        .withArgs(0, 0, buyer1.address, tokenURI);

      expect(await ticketNFT.ownerOf(0)).to.equal(buyer1.address);
      expect(await ticketNFT.tokenURI(0)).to.equal(tokenURI);

      const evt = await ticketNFT.events(0);
      expect(evt.ticketsMinted).to.equal(1);

      // Check payment reached organizer
      const newBalance = await ethers.provider.getBalance(organizer.address);
      expect(newBalance - initialBalance).to.equal(price);
    });
  });

  describe("Secondary Market & Resale", function () {
    beforeEach(async function () {
      await ticketNFT.connect(organizer).createEvent("Web3 Summit", price, maxSupply);
      await ticketNFT.connect(buyer1).buyTicket(0, tokenURI, { value: price });
    });

    it("Should enforce 150% price cap on resale listing", async function () {
      const exorbitantPrice = ethers.parseEther("0.2"); // 200% original price
      await expect(ticketNFT.connect(buyer1).listForResale(0, exorbitantPrice))
        .to.be.revertedWith("Price exceeds 150% cap");

      const validPrice = ethers.parseEther("0.15"); // 150%
      await expect(ticketNFT.connect(buyer1).listForResale(0, validPrice))
        .to.emit(ticketNFT, "TicketListed")
        .withArgs(0, validPrice, buyer1.address);
    });

    it("Should transfer ticket to buyer and split royalties on resale", async function () {
      const resalePrice = ethers.parseEther("0.15");
      await ticketNFT.connect(buyer1).listForResale(0, resalePrice);

      const oldOrgBalance = await ethers.provider.getBalance(organizer.address);
      const oldSellerBalance = await ethers.provider.getBalance(buyer1.address);

      await expect(ticketNFT.connect(buyer2).buyResaleTicket(0, { value: resalePrice }))
        .to.emit(ticketNFT, "TicketResold")
        .withArgs(0, buyer1.address, buyer2.address, resalePrice);

      expect(await ticketNFT.ownerOf(0)).to.equal(buyer2.address);

      const newOrgBalance = await ethers.provider.getBalance(organizer.address);
      const newSellerBalance = await ethers.provider.getBalance(buyer1.address);

      const expectedRoyalty = (resalePrice * 10n) / 100n; // 10%
      const expectedSellerRevenue = resalePrice - expectedRoyalty;

      expect(newOrgBalance - oldOrgBalance).to.equal(expectedRoyalty);
      // Allowing gas difference
      expect(newSellerBalance - oldSellerBalance).to.be.closeTo(expectedSellerRevenue, ethers.parseEther("0.01"));
    });
  });

  describe("Validation & Verification", function () {
    beforeEach(async function () {
      await ticketNFT.connect(organizer).createEvent("Web3 Summit", price, maxSupply);
      await ticketNFT.connect(buyer1).buyTicket(0, tokenURI, { value: price });
    });

    it("Should only allow organizer to mark ticket as used", async function () {
      await expect(ticketNFT.connect(buyer1).markAsUsed(0))
        .to.be.revertedWith("Only organizer can scan");

      await expect(ticketNFT.connect(organizer).markAsUsed(0))
        .to.emit(ticketNFT, "TicketUsed")
        .withArgs(0);

      expect(await ticketNFT.ticketUsed(0)).to.equal(true);
    });

    it("Should remove resale listing if ticket is transferred manually", async function () {
      await ticketNFT.connect(buyer1).listForResale(0, ethers.parseEther("0.1"));
      
      // Manual transfer to buyer2
      await ticketNFT.connect(buyer1).transferFrom(buyer1.address, buyer2.address, 0);

      const listing = await ticketNFT.resaleListings(0);
      expect(listing.isListed).to.equal(false);

      // Buyer2 cannot be sniped on obsolete listing
      await expect(ticketNFT.connect(owner).buyResaleTicket(0, { value: ethers.parseEther("0.1") }))
        .to.be.revertedWith("Ticket not listed for resale");
    });
  });
});
