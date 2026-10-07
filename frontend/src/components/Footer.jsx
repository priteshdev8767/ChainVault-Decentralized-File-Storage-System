import React from "react";
import { CONTRACT_ADDRESS } from "../contracts/contractConfig.js";

export default function Footer() {
  return (
    <footer className="footer">
      <div style={{ maxWidth: "1120px", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <strong>Decentralized File Storage using Blockchain & IPFS</strong>
          <div style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>
            College BE Mini Project • Ethereum Smart Contract + IPFS/Pinata
          </div>
        </div>

        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span>Contract: </span>
          <span className="mono" style={{ color: "var(--accent-cyan)" }}>
            {CONTRACT_ADDRESS ? `${CONTRACT_ADDRESS.substring(0, 10)}...${CONTRACT_ADDRESS.substring(CONTRACT_ADDRESS.length - 8)}` : "Not Deployed"}
          </span>
        </div>
      </div>
    </footer>
  );
}
