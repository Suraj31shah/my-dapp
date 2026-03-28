const hre = require("hardhat");

async function main() {
  console.log("Deploying TicketNFT contract...");
  const TicketNFT = await hre.ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy();
  await ticketNFT.waitForDeployment();
  console.log(`TicketNFT deployed to: ${await ticketNFT.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
