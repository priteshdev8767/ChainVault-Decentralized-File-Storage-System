const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FileStorage Smart Contract", function () {
  let fileStorage;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const FileStorageFactory = await ethers.getContractFactory("FileStorage");
    fileStorage = await FileStorageFactory.deploy();
    await fileStorage.waitForDeployment();
  });

  // 1. Contract deployment
  it("1. Should deploy successfully with initial 0 total files", async function () {
    const total = await fileStorage.getTotalFiles();
    expect(total).to.equal(0);
    const address = await fileStorage.getAddress();
    expect(address).to.be.properAddress;
  });

  // 2. Upload file record
  it("2. Should upload and register a file record", async function () {
    const tx = await fileStorage.connect(user1).uploadFile("project_report.pdf", "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");
    await tx.wait();

    const total = await fileStorage.getTotalFiles();
    expect(total).to.equal(1);
  });

  // 3. Retrieve file record
  it("3. Should retrieve file record by CID", async function () {
    const cid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
    await fileStorage.connect(user1).uploadFile("mini_project.pdf", cid);

    const file = await fileStorage.getFile(cid);
    expect(file.fileName).to.equal("mini_project.pdf");
    expect(file.cid).to.equal(cid);
  });

  // 4. Check owner
  it("4. Should correctly set and verify the file owner", async function () {
    const cid = "QmOwnerCheckCid123456789";
    await fileStorage.connect(user1).uploadFile("sample.txt", cid);

    const file = await fileStorage.getFile(cid);
    expect(file.owner).to.equal(user1.address);
  });

  // 5. Check CID
  it("5. Should accurately record CID and reject duplicate CID uploads", async function () {
    const cid = "QmUniqueCheckCid987654321";
    await fileStorage.connect(user1).uploadFile("file1.png", cid);

    const exists = await fileStorage.checkFileExists(cid);
    expect(exists).to.be.true;

    // Duplicate CID attempt should revert
    await expect(
      fileStorage.connect(user2).uploadFile("file2.png", cid)
    ).to.be.revertedWith("File CID already registered on blockchain");
  });

  // 6. Check timestamp
  it("6. Should set a valid block timestamp for the uploaded file", async function () {
    const cid = "QmTimestampTestCid000111";
    await fileStorage.connect(user1).uploadFile("notes.docx", cid);

    const file = await fileStorage.getFile(cid);
    expect(file.timestamp).to.be.greaterThan(0);
  });

  // 7. Retrieve files belonging to a wallet
  it("7. Should retrieve files belonging specifically to the caller's wallet", async function () {
    const cid1 = "QmUser1File1";
    const cid2 = "QmUser1File2";
    const cid3 = "QmUser2File1";

    await fileStorage.connect(user1).uploadFile("u1_file1.pdf", cid1);
    await fileStorage.connect(user1).uploadFile("u1_file2.pdf", cid2);
    await fileStorage.connect(user2).uploadFile("u2_file1.png", cid3);

    const user1Files = await fileStorage.connect(user1).getMyFiles();
    expect(user1Files.length).to.equal(2);
    expect(user1Files[0].fileName).to.equal("u1_file1.pdf");
    expect(user1Files[1].fileName).to.equal("u1_file2.pdf");

    const user2Files = await fileStorage.connect(user2).getMyFiles();
    expect(user2Files.length).to.equal(1);
    expect(user2Files[0].fileName).to.equal("u2_file1.png");
  });
});
