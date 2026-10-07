import React from "react";
import { formatAddress } from "../utils/web3";
import { HardDrive, UploadCloud, FolderCheck, CheckCircle2, Wallet, ExternalLink } from "lucide-react";

export default function Navbar({
  currentAccount,
  onConnectWallet,
  activeTab,
  setActiveTab,
  isConnecting
}) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="nav-brand" style={{ cursor: "pointer" }} onClick={() => setActiveTab("dashboard")}>
          <div className="nav-brand-icon">
            <HardDrive size={20} />
          </div>
          <div>
            <span>IPFS Storage DApp</span>
            <span style={{ fontSize: "0.7rem", display: "block", color: "var(--text-muted)", fontWeight: "normal" }}>
              BE Mini Project
            </span>
          </div>
        </div>

        <nav>
          <ul className="nav-links">
            <li>
              <button
                className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                Dashboard
              </button>
            </li>
            <li>
              <button
                className={`nav-btn ${activeTab === "upload" ? "active" : ""}`}
                onClick={() => setActiveTab("upload")}
              >
                <UploadCloud size={16} /> Upload File
              </button>
            </li>
            <li>
              <button
                className={`nav-btn ${activeTab === "my-files" ? "active" : ""}`}
                onClick={() => setActiveTab("my-files")}
              >
                <FolderCheck size={16} /> My Files
              </button>
            </li>
            <li>
              <button
                className={`nav-btn ${activeTab === "verify" ? "active" : ""}`}
                onClick={() => setActiveTab("verify")}
              >
                <CheckCircle2 size={16} /> Verify File
              </button>
            </li>
          </ul>
        </nav>

        <div>
          {currentAccount ? (
            <div className="wallet-badge" title={currentAccount}>
              <span className="status-dot online"></span>
              <span>{formatAddress(currentAccount)}</span>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={onConnectWallet}
              disabled={isConnecting}
            >
              <Wallet size={16} />
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
