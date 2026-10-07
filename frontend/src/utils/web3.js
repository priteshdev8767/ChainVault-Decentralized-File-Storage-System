import { ethers } from "ethers";
import { CONTRACT_ADDRESS, RPC_URL, CHAIN_ID } from "../contracts/contractConfig.js";
import FileStorageABI from "../contracts/FileStorageABI.json";

/**
 * Shorten wallet address for UI display (e.g. 0xD4C9...06a6)
 */
export function formatAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Format Unix timestamp to localized string
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return "-";
  const num = Number(timestamp);
  if (isNaN(num) || num === 0) return "-";
  return new Date(num * 1000).toLocaleString();
}

/**
 * Check if MetaMask is installed in the browser
 */
export function isMetaMaskInstalled() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

/**
 * Request wallet connection via MetaMask
 */
export async function connectWallet() {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed. Please install MetaMask browser extension.");
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts"
  });

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found in MetaMask.");
  }

  // Switch or prompt to switch to Hardhat Localhost (Chain ID: 31337 / 0x7a69)
  await checkOrSwitchNetwork();

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}

/**
 * Switch or add Hardhat Localhost Network to MetaMask
 */
export async function checkOrSwitchNetwork() {
  if (!isMetaMaskInstalled()) return;

  const chainIdHex = "0x" + Number(CHAIN_ID).toString(16);

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }]
    });
  } catch (switchError) {
    // Error 4902 indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainIdHex,
              chainName: "Hardhat Localhost",
              rpcUrls: [RPC_URL],
              nativeCurrency: {
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18
              }
            }
          ]
        });
      } catch (addError) {
        console.warn("Failed to add network to MetaMask:", addError);
      }
    } else {
      console.warn("Could not switch network:", switchError);
    }
  }
}

/**
 * Get read-only contract instance (uses browser provider if connected, else fallback JsonRpcProvider)
 */
export async function getReadOnlyContract() {
  let provider;
  if (isMetaMaskInstalled()) {
    provider = new ethers.BrowserProvider(window.ethereum);
  } else {
    provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return new ethers.Contract(CONTRACT_ADDRESS, FileStorageABI, provider);
}

/**
 * Get write contract instance connected to signer
 */
export async function getWriteContract() {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed.");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, FileStorageABI, signer);
}
