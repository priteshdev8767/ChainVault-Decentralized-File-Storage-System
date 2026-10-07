import React, { useEffect, useState } from "react";
import { getWriteContract, formatAddress, formatTimestamp } from "../utils/web3";
import { getIpfsUrl } from "../utils/pinata";
import {
  FolderCheck,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Wallet,
  ArrowRight,
  FileText
} from "lucide-react";

export default function MyFiles({ currentAccount, onConnectWallet, setActiveTab }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedCid, setCopiedCid] = useState("");

  useEffect(() => {
    if (currentAccount) {
      loadMyFiles();
    }
  }, [currentAccount]);

  async function loadMyFiles() {
    if (!currentAccount) return;
    setLoading(true);
    try {
      const contract = await getWriteContract();
      const userFiles = await contract.getMyFiles();

      const formatted = userFiles.map((f) => ({
        fileName: f.fileName,
        cid: f.cid,
        owner: f.owner,
        timestamp: Number(f.timestamp)
      }));

      // Sort newest first
      formatted.reverse();
      setFiles(formatted);
    } catch (err) {
      console.error("Error loading user files:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyCid(cid) {
    navigator.clipboard.writeText(cid);
    setCopiedCid(cid);
    setTimeout(() => setCopiedCid(""), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>My Uploaded Files</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Files registered on the blockchain specifically under connected wallet{" "}
            {currentAccount && <span className="mono" style={{ color: "var(--accent-cyan)" }}>({formatAddress(currentAccount)})</span>}
          </p>
        </div>

        {currentAccount && (
          <button className="btn btn-secondary btn-sm" onClick={loadMyFiles} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        )}
      </div>

      {/* Wallet Not Connected Prompt */}
      {!currentAccount ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <Wallet size={48} style={{ color: "var(--text-dim)", margin: "0 auto 1rem" }} />
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>MetaMask Wallet Not Connected</h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0.5rem auto 1.5rem" }}>
            Connect your MetaMask wallet to view the decentralized files associated with your blockchain account.
          </p>
          <button className="btn btn-primary" onClick={onConnectWallet}>
            Connect MetaMask
          </button>
        </div>
      ) : files.length === 0 ? (
        /* Empty State */
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <FileText size={48} style={{ color: "var(--text-dim)", margin: "0 auto 1rem" }} />
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>No Files Uploaded Yet</h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0.5rem auto 1.5rem" }}>
            You haven't stored any files on the blockchain yet with this wallet address.
          </p>
          <button className="btn btn-primary" onClick={() => setActiveTab("upload")}>
            Upload Your First File <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        /* Table of Files */
        <div className="card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>IPFS CID</th>
                  <th>Owner Address</th>
                  <th>Date & Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{file.fileName}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className="mono" style={{ fontSize: "0.82rem", color: "var(--accent-cyan)" }}>
                          {file.cid.length > 22
                            ? `${file.cid.substring(0, 10)}...${file.cid.substring(file.cid.length - 8)}`
                            : file.cid}
                        </span>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "0.2rem 0.4rem" }}
                          onClick={() => handleCopyCid(file.cid)}
                          title="Copy full CID"
                        >
                          {copiedCid === file.cid ? <Check size={12} style={{ color: "var(--success)" }} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: "0.82rem" }}>
                      {formatAddress(file.owner)}
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {formatTimestamp(file.timestamp)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <a
                          href={getIpfsUrl(file.cid)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ padding: "0.3rem 0.65rem" }}
                        >
                          <ExternalLink size={12} /> View File
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
