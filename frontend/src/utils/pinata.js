import axios from "axios";

// Default public IPFS gateways for viewing uploaded files
export const IPFS_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/"
];

/**
 * Get accessible gateway URL for a given IPFS CID
 */
export function getIpfsUrl(cid) {
  if (!cid) return "#";
  // If it's already an HTTP URL, return as-is
  if (cid.startsWith("http://") || cid.startsWith("https://")) {
    return cid;
  }
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

/**
 * Upload a File object to IPFS via Pinata.
 * Attempts the secure local dev server proxy first to avoid exposing credentials.
 * Falls back to direct client-side upload if VITE_PINATA_JWT is present.
 *
 * @param {File} file - The browser File object to upload
 * @returns {Promise<{ cid: string, size: number, timestamp: string }>}
 */
export async function uploadFileToIPFS(file) {
  if (!file) {
    throw new Error("No file selected for upload.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const metadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      uploadedAt: new Date().toISOString(),
      project: "College BE Mini Project - Decentralized Storage"
    }
  });
  formData.append("pinataMetadata", metadata);

  const options = JSON.stringify({
    cidVersion: 0
  });
  formData.append("pinataOptions", options);

  // Strategy 1: Try the secure Vite dev proxy endpoint `/api/pinata-upload`
  try {
    const response = await axios.post("/api/pinata-upload", formData, {
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    if (response.data && response.data.IpfsHash) {
      return {
        cid: response.data.IpfsHash,
        size: response.data.PinSize || file.size,
        timestamp: response.data.Timestamp || new Date().toISOString()
      };
    }
  } catch (proxyError) {
    const errMsg = proxyError.response?.data?.error || proxyError.message;

    // Check if error is because user hasn't set the JWT in .env yet
    if (errMsg && errMsg.includes("PINATA_JWT is not configured")) {
      throw new Error(
        "Pinata JWT not found in .env! Open your .env file and set PINATA_JWT=your_pinata_jwt, then restart the frontend."
      );
    }

    // Strategy 2: If proxy failed with non-config error, try client-side direct if VITE_PINATA_JWT is provided
    const directJwt = import.meta.env.VITE_PINATA_JWT;
    if (directJwt && !directJwt.includes("PASTE_YOUR_NEW")) {
      try {
        const directResponse = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          formData,
          {
            maxBodyLength: Infinity,
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${directJwt.trim()}`
            }
          }
        );

        if (directResponse.data && directResponse.data.IpfsHash) {
          return {
            cid: directResponse.data.IpfsHash,
            size: directResponse.data.PinSize || file.size,
            timestamp: directResponse.data.Timestamp || new Date().toISOString()
          };
        }
      } catch (directErr) {
        throw new Error(
          "Pinata direct upload failed: " +
            (directErr.response?.data?.error?.details || directErr.message)
        );
      }
    }

    throw new Error(`Upload to IPFS failed: ${errMsg}`);
  }
}
