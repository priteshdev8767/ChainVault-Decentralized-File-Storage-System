import React, { useState } from "react";
import { getReadOnlyContract, formatAddress, formatTimestamp } from "../utils/web3";
import { getIpfsUrl } from "../utils/pinata";
import {
  CheckCircle2,
  XCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  FileCheck
} from "lucide-react";

export default function VerifyFile() {
  const [cidInput, setCidInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [searchedCid, setSearchedCid] = useState("");

  async function handleVerify(e) {
    if (e) e.preventDefault();
    const trimmed = cidInput.trim();
    if (!trimmed) return;

    setIsVerifying(true);
    setVerificationResult(null);
    setSearchedCid(trimmed);

    try {
      const contract = await getReadOnlyContract();

      // Check if CID exists
      const exists = await contract.checkFileExists(trimmed);

      if (exists) {
        // Retrieve full metadata record
        const file = await contract.getFile(trimmed);
        setVerificationResult({
          verified: true,
          fileName: file.fileName,
          cid: file.cid,
          owner: file.owner,
          timestamp: Number(file.timestamp)
        });
      } else {
        setVerificationResult({
          verified: false,
          cid: trimmed
        });
      }
    } catch (err) {
      console.error("Verification error:", err);
      setVerificationResult({
        verified: false,
        cid: trimmed,
        error: err.message
      });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div style={{ maxWidth: "750px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Verify File Authenticity</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Verify whether an IPFS Content Identifier (CID) exists on the blockchain ledger, proving file authenticity, original uploader, and timestamp.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="card">
        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label className="form-label" htmlFor="cidInput">
              Enter IPFS CID (Content Identifier Hash)
            </label>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <input
                id="cidInput"
                type="text"
                className="form-input mono"
                placeholder="e.g. QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
                value={cidInput}
                onChange={(e) => setCidInput(e.target.value)}
                style={{ flex: 1, minWidth: "260px" }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!cidInput.trim() || isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <Search size={16} /> Verify File
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Verification Result Display */}
      {verificationResult && (
        <div className="card" style={{ borderTop: `4px solid ${verificationResult.verified ? "var(--success)" : "var(--danger)"}` }}>
          {verificationResult.verified ? (
            /* VERIFIED STATE */
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ background: "var(--success-bg)", padding: "0.5rem", borderRadius: "50%", color: "var(--success)" }}>
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <span className="badge badge-success" style={{ fontSize: "0.85rem", padding: "0.3rem 0.75rem" }}>
                    ✓ File Verified
                  </span>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Cryptographic record confirmed on Ethereum blockchain ledger.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", background: "var(--bg-main)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>File Name:</span>
                  <span style={{ fontWeight: 600 }}>{verificationResult.fileName}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>IPFS CID:</span>
                  <span className="mono" style={{ color: "var(--accent-cyan)", fontSize: "0.85rem", wordBreak: "break-all" }}>
                    {verificationResult.cid}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Owner (Uploader Address):</span>
                  <span className="mono" style={{ fontSize: "0.85rem" }}>
                    {verificationResult.owner}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Blockchain Timestamp:</span>
                  <span style={{ fontSize: "0.85rem" }}>
                    {formatTimestamp(verificationResult.timestamp)}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>IPFS Gateway Source:</span>
                  <a
                    href={getIpfsUrl(verificationResult.cid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    <ExternalLink size={12} /> View File on IPFS
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* NOT FOUND STATE */
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ background: "var(--danger-bg)", padding: "0.5rem", borderRadius: "50%", color: "var(--danger)" }}>
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <span className="badge badge-danger" style={{ fontSize: "0.85rem", padding: "0.3rem 0.75rem" }}>
                    ✕ File record not found
                  </span>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    No matching file record exists on the smart contract for this CID.
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--bg-main)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                <div>Queried CID: <code className="mono" style={{ color: "var(--text-main)" }}>{searchedCid}</code></div>
                <p style={{ marginTop: "0.5rem" }}>
                  This means the file has either never been registered on the blockchain, or the file contents were altered (changing the resulting CID).
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
