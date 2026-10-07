// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FileStorage
 * @dev College Mini Project: Decentralized File Storage using Blockchain and IPFS
 * Simple, readable smart contract to register and verify IPFS file records.
 */
contract FileStorage {
    // Structure representing an uploaded file record
    struct File {
        string fileName;
        string cid;
        address owner;
        uint256 timestamp;
    }

    // Array storing all uploaded files across all users
    File[] private allFiles;

    // Mapping from user wallet address to their uploaded files
    mapping(address => File[]) private userFiles;

    // Mapping from IPFS CID to File record for fast O(1) lookup
    mapping(string => File) private cidToFile;

    // Mapping to track whether a CID already exists on-chain
    mapping(string => bool) private cidExists;

    // Event emitted when a file is successfully registered on-chain
    event FileUploaded(
        string indexed cid,
        string fileName,
        address indexed owner,
        uint256 timestamp
    );

    /**
     * @notice Store a new file record on the blockchain
     * @param _fileName Name of the file (e.g. document.pdf)
     * @param _cid IPFS Content Identifier returned from Pinata/IPFS
     */
    function uploadFile(string memory _fileName, string memory _cid) external {
        require(bytes(_fileName).length > 0, "File name cannot be empty");
        require(bytes(_cid).length > 0, "IPFS CID cannot be empty");
        require(!cidExists[_cid], "File CID already registered on blockchain");

        File memory newFile = File({
            fileName: _fileName,
            cid: _cid,
            owner: msg.sender,
            timestamp: block.timestamp
        });

        allFiles.push(newFile);
        userFiles[msg.sender].push(newFile);
        cidToFile[_cid] = newFile;
        cidExists[_cid] = true;

        emit FileUploaded(_cid, _fileName, msg.sender, block.timestamp);
    }

    /**
     * @notice Retrieve all files uploaded by the calling wallet address
     * @return Array of File structs belonging to msg.sender
     */
    function getMyFiles() external view returns (File[] memory) {
        return userFiles[msg.sender];
    }

    /**
     * @notice Retrieve a specific file record by its IPFS CID
     * @param _cid IPFS Content Identifier
     * @return File struct containing fileName, cid, owner, timestamp
     */
    function getFile(string memory _cid) external view returns (File memory) {
        require(cidExists[_cid], "File record not found");
        return cidToFile[_cid];
    }

    /**
     * @notice Check whether a file record exists for a given CID
     * @param _cid IPFS Content Identifier
     * @return True if file exists on-chain, false otherwise
     */
    function checkFileExists(string memory _cid) external view returns (bool) {
        return cidExists[_cid];
    }

    /**
     * @notice Get the total count of files registered on the smart contract
     * @return Total number of uploaded files
     */
    function getTotalFiles() external view returns (uint256) {
        return allFiles.length;
    }

    /**
     * @notice Retrieve all files (for dashboard / overview purposes)
     * @return Array of all File structs
     */
    function getAllFiles() external view returns (File[] memory) {
        return allFiles;
    }
}
