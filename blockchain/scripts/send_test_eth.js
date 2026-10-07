const hre = require("hardhat");

async function main() {
  const recipient = "0xD4C9eBbeD2525A6fb99B41E68d0db83C43F806a6";
  const amountEth = "10.0";

  const [sender] = await hre.ethers.getSigners();
  console.log("--------------------------------------------------");
  console.log("Funding MetaMask Account with Local Test ETH");
  console.log("--------------------------------------------------");
  console.log("Sender (Hardhat Account #0):", sender.address);
  console.log("Recipient (MetaMask):       ", recipient);

  const initialSenderBalance = await hre.ethers.provider.getBalance(sender.address);
  const initialRecipientBalance = await hre.ethers.provider.getBalance(recipient);
  console.log("Sender initial balance:   ", hre.ethers.formatEther(initialSenderBalance), "ETH");
  console.log("Recipient initial balance:", hre.ethers.formatEther(initialRecipientBalance), "ETH");

  console.log(`\nSending ${amountEth} local test ETH...`);
  const tx = await sender.sendTransaction({
    to: recipient,
    value: hre.ethers.parseEther(amountEth),
  });

  console.log("Transaction Hash:", tx.hash);
  console.log("Waiting for confirmation...");
  await tx.wait();

  const finalRecipientBalance = await hre.ethers.provider.getBalance(recipient);
  console.log("==================================================");
  console.log("Transfer successful!");
  console.log("Recipient new balance:", hre.ethers.formatEther(finalRecipientBalance), "ETH");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Transfer failed:", error);
  process.exitCode = 1;
});
