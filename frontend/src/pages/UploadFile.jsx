import React, { useState } from "react";
import { uploadFileToIPFS, getIpfsUrl } from "../utils/pinata";
import { getWriteContract } from "../utils/web3";
import {
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Database,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function UploadFile({ currentAccount, onConnectWallet, setActiveTab, onFileUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);
  const [ipfsCid, setIpfsCid] = useState("");
  const [isRecordingOnChain, setIsRecordingOnChain] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Determine current active step (1: Select File, 2: Upload IPFS, 3: Blockchain Tx, 4: Complete)
  let currentStep = 1;
  if (successMessage) {
    currentStep = 4;
  } else if (ipfsCid) {
    currentStep = 3;
  } else if (selectedFile) {
    currentStep = 2;
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIpfsCid("");
      setTxHash("");
      setErrorMessage("");
      setSuccessMessage("");
    }
  }

  // Step 2: Upload to IPFS (via Pinata)
  async function handleUploadToIPFS() {
    if (!selectedFile) {
      setErrorMessage("Please select a file first.");
      return;
    }

    setErrorMessage("");
    setIsUploadingToIPFS(true);

    try {
      const result = await uploadFileToIPFS(selectedFile);
      setIpfsCid(result.cid);
    } catch (err) {
      console.error("IPFS Upload Error:", err);
      setErrorMessage(err.message || "Failed to upload file to IPFS.");
    } finally {
      setIsUploadingToIPFS(false);
    }
  }

  // Quick fallback demo mode if user doesn't have Pinata key right away during viva
  function handleUseSimulatedCid() {
    // Generate a deterministic mock IPFS CID for offline testing
    const mockHash = "Qm" + Array.from(selectedFile ? selectedFile.name + Date.now() : "CollegeDemo" + Date.now())
      .map((c) => c.charCodeAt(0).toString(16))
      .join("")
      .substring(0, 44);
    setIpfsCid(mockHash);
    setErrorMessage("");
  }

  // Step 3: Record CID + Metadata on Solidity Smart Contract
  async function handleRecordOnBlockchain() {
    if (!currentAccount) {
      setErrorMessage("Please connect your MetaMask wallet before recording to blockchain.");
      return;
    }

    if (!ipfsCid) {
      setErrorMessage("IPFS CID is missing. Upload to IPFS first.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsRecordingOnChain(true);

    try {
      const contract = await getWriteContract();
      const fileName = selectedFile ? selectedFile.name : "Document";

      // Call smart contract uploadFile(fileName, cid)
      const tx = await contract.uploadFile(fileName, ipfsCid);
      setTxHash(tx.hash);

      // Wait for block confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setSuccessMessage(`File "${fileName}" successfully recorded on Blockchain!`);
        if (onFileUploaded) onFileUploaded();
      } else {
        throw new Error("Transaction was reverted on blockchain.");
      }
    } catch (err) {
      console.error("Blockchain Error:", err);
      // Clean up common error messages
      if (err.code === "ACTION_REJECTED" || err.message?.includes("user rejected action")) {
        setErrorMessage("MetaMask transaction was rejected by user.");
      } else if (err.message?.includes("File CID already registered")) {
        setErrorMessage("This file CID is already registered on the blockchain!");
      } else {
        setErrorMessage(err.reason || err.message || "Failed to store record on blockchain.");
      }
    } finally {
      setIsRecordingOnChain(false);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setIpfsCid("");
    setTxHash("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Upload & Store File</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Step-by-step pipeline: Upload file to IPFS via Pinata, obtain cryptographic CID, and register ownership on Ethereum smart contract.
        </p>
      </div>

      {/* Visual Pipeline Progress */}
      <div className="pipeline-steps">
        <div className={`step-item ${currentStep >= 1 ? "active" : ""} ${currentStep > 1 ? "completed" : ""}`}>
          <div className="step-circle">{currentStep > 1 ? "✓" : "1"}</div>
          <div className="step-title">Select File</div>
        </div>
        <div className={`step-item ${currentStep >= 2 ? "active" : ""} ${currentStep > 2 ? "completed" : ""}`}>
          <div className="step-circle">{currentStep > 2 ? "✓" : "2"}</div>
          <div className="step-title">Upload to IPFS</div>
        </div>
        <div className={`step-item ${currentStep >= 3 ? "active" : ""} ${currentStep > 3 ? "completed" : ""}`}>
          <div className="step-circle">{currentStep > 3 ? "✓" : "3"}</div>
          <div className="step-title">Blockchain Record</div>
        </div>
        <div className={`step-item ${currentStep >= 4 ? "completed" : ""}`}>
          <div className="step-circle">{currentStep >= 4 ? "✓" : "4"}</div>
          <div className="step-title">Confirmed</div>
        </div>
      </div>

      {/* Wallet Warning if not connected */}
      {!currentAccount && (
        <div className="alert alert-warning">
          <AlertCircle size={20} />
          <div style={{ flex: 1 }}>
            <strong>MetaMask Wallet Not Connected:</strong> You can upload to IPFS, but you will need MetaMask to sign the transaction and store the record on the blockchain.
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onConnectWallet}>
            Connect Now
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <div style={{ flex: 1 }}>
            <div>{errorMessage}</div>
            {errorMessage.includes("Pinata JWT not found") && (
              <div style={{ marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Want to test locally without Pinata first?{" "}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: "0.3rem" }}
                  onClick={handleUseSimulatedCid}
                >
                  <Sparkles size={14} /> Use Demo CID for College Viva Test
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div className="alert alert-success">
          <CheckCircle2 size={24} />
          <div style={{ flex: 1 }}>
            <strong>Transaction Confirmed!</strong>
            <div>{successMessage}</div>
            {txHash && (
              <div className="mono" style={{ fontSize: "0.8rem", marginTop: "0.25rem", wordBreak: "break-all" }}>
                Tx Hash: {txHash}
              </div>
            )}
            <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-success btn-sm" onClick={() => setActiveTab("my-files")}>
                View in "My Files" <ArrowRight size={14} />
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleReset}>
                Upload Another File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Upload Card */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: "1rem" }}>
          <UploadCloud size={20} /> File Upload Section
        </h2>

        {/* Step 1: File Selection Dropzone */}
        <div className="form-group">
          <label className="form-label">1. Choose File from Local Machine</label>
          <input
            type="file"
            id="fileInput"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <div
            className="dropzone"
            onClick={() => document.getElementById("fileInput").click()}
          >
            <div className="dropzone-icon">
              <UploadCloud size={40} />
            </div>
            <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-main)" }}>
              {selectedFile ? selectedFile.name : "Click here to browse and select a file"}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              {selectedFile
                ? `Size: ${(selectedFile.size / 1024).toFixed(1)} KB | Type: ${selectedFile.type || "Document"}`
                : "Supports PDF, images (PNG, JPG), documents, or any file format"}
            </div>
          </div>
        </div>

        {/* Step 2: Pinata IPFS Upload Action */}
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem", marginTop: "1.25rem" }}>
          <label className="form-label">2. Decentralized Storage (Pinata / IPFS)</label>

          {ipfsCid ? (
            <div style={{ background: "var(--bg-main)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <span className="badge badge-success">
                  <CheckCircle2 size={12} /> IPFS CID Received
                </span>
                <a
                  href={getIpfsUrl(ipfsCid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                >
                  <ExternalLink size={12} /> View on IPFS Gateway
                </a>
              </div>
              <div className="mono" style={{ wordBreak: "break-all", fontSize: "0.85rem", color: "var(--accent-cyan)", background: "#0a0f1d", padding: "0.6rem", borderRadius: "4px" }}>
                {ipfsCid}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <button
                className="btn btn-primary"
                onClick={handleUploadToIPFS}
                disabled={!selectedFile || isUploadingToIPFS}
              >
                {isUploadingToIPFS ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Uploading to IPFS...
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} /> Upload to IPFS via Pinata
                  </>
                )}
              </button>

              {selectedFile && !ipfsCid && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleUseSimulatedCid}
                  title="Generate a demo CID for quick testing if you haven't setup Pinata API yet"
                >
                  <Sparkles size={14} /> Quick Demo CID
                </button>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Blockchain Registration Action */}
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem", marginTop: "1.25rem" }}>
          <label className="form-label">3. Register on Ethereum Smart Contract</label>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
            Invokes <code className="mono">uploadFile(fileName, cid)</code> on Solidity contract to permanently associate your wallet address with the IPFS CID and block timestamp.
          </p>

          <button
            className="btn btn-success"
            onClick={handleRecordOnBlockchain}
            disabled={!ipfsCid || isRecordingOnChain || Boolean(successMessage)}
          >
            {isRecordingOnChain ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Confirming in MetaMask...
              </>
            ) : successMessage ? (
              <>
                <CheckCircle2 size={16} /> Already Recorded on-chain
              </>
            ) : (
              <>
                <Database size={16} /> Store on Blockchain
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
