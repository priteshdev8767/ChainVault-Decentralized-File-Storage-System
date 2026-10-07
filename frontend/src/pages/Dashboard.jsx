import React, { useEffect, useState } from "react";
import { getReadOnlyContract, formatAddress, formatTimestamp } from "../utils/web3";
import { getIpfsUrl } from "../utils/pinata";
import {
  Database,
  FileCheck2,
  HardDrive,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  ExternalLink
} from "lucide-react";

export default function Dashboard({ currentAccount, onConnectWallet, setActiveTab }) {
  const [totalFiles, setTotalFiles] = useState(0);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [currentAccount]);

  async function fetchStats() {
    setLoading(true);
    try {
      const contract = await getReadOnlyContract();
      const count = await contract.getTotalFiles();
      setTotalFiles(Number(count));

      // Get recent files if any exist
      if (Number(count) > 0) {
        const all = await contract.getAllFiles();
        // Take the latest 5 files in reverse chronological order
        const formatted = all
          .map((f) => ({
            fileName: f.fileName,
            cid: f.cid,
            owner: f.owner,
            timestamp: Number(f.timestamp)
          }))
          .reverse()
          .slice(0, 5);

        setRecentFiles(formatted);
      } else {
        setRecentFiles([]);
      }
    } catch (err) {
      console.warn("Could not fetch dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Hero Header */}
      <div className="card" style={{ background: "linear-gradient(135deg, #111827 0%, #17223b 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: "0.5rem" }}>
              College BE Mini Project
            </span>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, marginTop: "0.4rem", color: "#fff" }}>
              Decentralized File Storage using Blockchain & IPFS
            </h1>
            <p style={{ color: "var(--text-muted)", maxWidth: "650px", marginTop: "0.5rem", fontSize: "0.95rem" }}>
              A hybrid decentralized architecture combining the high storage capacity of the
              InterPlanetary File System (IPFS) with the immutable integrity and ownership verification of Ethereum Smart Contracts.
            </p>
          </div>

          <div>
            {currentAccount ? (
              <div style={{ background: "var(--bg-main)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Connected Wallet</div>
                <div className="mono" style={{ fontWeight: 600, color: "var(--accent-cyan)", fontSize: "0.9rem" }}>
                  {formatAddress(currentAccount)}
                </div>
                <span className="badge badge-success" style={{ marginTop: "0.4rem" }}>
                  Active Signer
                </span>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={onConnectWallet}>
                <Wallet size={18} /> Connect MetaMask
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-sm" onClick={() => setActiveTab("upload")}>
            Upload New File <ArrowRight size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab("my-files")}>
            View My Files
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab("verify")}>
            Verify File Record
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid-3">
        <div className="stat-card">
          <div className="stat-icon">
            <Database size={24} />
          </div>
          <div>
            <div className="stat-label">Total Files Stored</div>
            <div className="stat-value">{loading ? "..." : totalFiles}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)" }}>
            <Wallet size={24} />
          </div>
          <div>
            <div className="stat-label">Active Wallet</div>
            <div className="stat-value" style={{ fontSize: "1.1rem" }}>
              {currentAccount ? formatAddress(currentAccount) : "Not Connected"}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="stat-label">Smart Contract Status</div>
            <div className="stat-value" style={{ fontSize: "1.1rem", color: "var(--success)" }}>
              Active (Hardhat)
            </div>
          </div>
        </div>
      </div>

      {/* Recent Files Section */}
      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 className="card-title">
              <FileCheck2 size={20} /> Recent Blockchain File Records
            </h2>
            <p className="card-subtitle">Latest files registered across the network</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchStats}>
            Refresh
          </button>
        </div>

        {recentFiles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            {loading ? "Loading records..." : "No files stored yet. Be the first to upload a file!"}
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>IPFS CID</th>
                  <th>Uploader (Owner)</th>
                  <th>Date & Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentFiles.map((file, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{file.fileName}</td>
                    <td className="mono" style={{ fontSize: "0.8rem", color: "var(--accent-cyan)" }}>
                      {file.cid.length > 20 ? `${file.cid.substring(0, 10)}...${file.cid.substring(file.cid.length - 8)}` : file.cid}
                    </td>
                    <td className="mono" style={{ fontSize: "0.8rem" }}>
                      {formatAddress(file.owner)}
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {formatTimestamp(file.timestamp)}
                    </td>
                    <td>
                      <a
                        href={getIpfsUrl(file.cid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "0.3rem 0.6rem" }}
                      >
                        <ExternalLink size={12} /> View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Viva / Architectural Explanation Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Layers size={20} /> How It Works: Blockchain + IPFS Architecture
          </h2>
          <p className="card-subtitle">
            Core concepts to understand and explain during your college project viva
          </p>
        </div>

        <div className="grid-3">
          <div style={{ background: "var(--bg-main)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "var(--accent-cyan)", fontWeight: 700 }}>
              <HardDrive size={18} /> 1. IPFS (Storage Layer)
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Large files (PDFs, images, docs) are NOT stored directly on the blockchain because storing MBs of data would incur astronomical gas fees. Instead, IPFS splits the file into cryptographic chunks and generates a unique <strong>Content Identifier (CID)</strong> hash.
            </p>
          </div>

          <div style={{ background: "var(--bg-main)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "#818cf8", fontWeight: 700 }}>
              <Cpu size={18} /> 2. Blockchain (Trust Layer)
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              The Solidity smart contract stores only the lightweight metadata: <strong>File Name, IPFS CID, Owner Address, and Block Timestamp</strong>. This guarantees tamper-proof proof-of-ownership without bloating the blockchain state.
            </p>
          </div>

          <div style={{ background: "var(--bg-main)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "var(--success)", fontWeight: 700 }}>
              <ShieldCheck size={18} /> 3. Verification (Audit Layer)
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Anyone can verify a file's authenticity by querying the smart contract with its CID. If the CID exists, the smart contract confirms the exact original uploader and registration timestamp. Any alteration to the file changes its CID completely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
