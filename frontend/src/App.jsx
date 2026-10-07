import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import UploadFile from "./pages/UploadFile";
import MyFiles from "./pages/MyFiles";
import VerifyFile from "./pages/VerifyFile";
import { connectWallet, isMetaMaskInstalled } from "./utils/web3";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isConnecting, setIsConnecting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if wallet is already connected on page load
  useEffect(() => {
    async function checkConnectedWallet() {
      if (isMetaMaskInstalled()) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) {
            setCurrentAccount(accounts[0]);
          }
        } catch (err) {
          console.warn("Could not check accounts:", err);
        }
      }
    }

    checkConnectedWallet();

    // Listen to account changes in MetaMask
    if (isMetaMaskInstalled()) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
        } else {
          setCurrentAccount("");
        }
      };

      const handleChainChanged = () => {
        // Reload page on network change as recommended by MetaMask
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, []);

  async function handleConnectWallet() {
    setIsConnecting(true);
    try {
      const { address } = await connectWallet();
      setCurrentAccount(address);
    } catch (err) {
      console.error("Connection failed:", err);
      alert(err.message || "Failed to connect MetaMask");
    } finally {
      setIsConnecting(false);
    }
  }

  function handleFileUploaded() {
    setRefreshTrigger((prev) => prev + 1);
  }

  return (
    <div className="app-container">
      <Navbar
        currentAccount={currentAccount}
        onConnectWallet={handleConnectWallet}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnecting={isConnecting}
      />

      <main className="main-content">
        {activeTab === "dashboard" && (
          <Dashboard
            currentAccount={currentAccount}
            onConnectWallet={handleConnectWallet}
            setActiveTab={setActiveTab}
            key={refreshTrigger}
          />
        )}

        {activeTab === "upload" && (
          <UploadFile
            currentAccount={currentAccount}
            onConnectWallet={handleConnectWallet}
            setActiveTab={setActiveTab}
            onFileUploaded={handleFileUploaded}
          />
        )}

        {activeTab === "my-files" && (
          <MyFiles
            currentAccount={currentAccount}
            onConnectWallet={handleConnectWallet}
            setActiveTab={setActiveTab}
            key={refreshTrigger}
          />
        )}

        {activeTab === "verify" && <VerifyFile />}
      </main>

      <Footer />
    </div>
  );
}
