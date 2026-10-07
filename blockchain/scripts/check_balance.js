const hre = require("hardhat");

async function main() {
  const address = "0xD4C9eBbeD2525A6fb99B41E68d0db83C43F806a6";

  const balance = await hre.ethers.provider.getBalance(address);
  console.log("--------------------------------------------------");
  console.log("Address: ", address);
  console.log("Balance: ", hre.ethers.formatEther(balance), "ETH");
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error("Failed to fetch balance:", error);
  process.exitCode = 1;
});
