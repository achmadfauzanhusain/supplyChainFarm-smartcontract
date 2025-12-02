// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SupplyChainNFT is ERC721, Ownable {
    struct Product {
        string name;
        string origin;
        string batch_number;
        uint256 quantity_kg;
        string metadataURI; // description + production_date
        string currentStatus;
        address supplier;
        uint256 createdAt;
    }

    mapping(uint256 => Product) public products;
    mapping(address => bool) public verifiedSuppliers; // daftar supplier resmi
    uint256 public nextTokenId = 1;
    uint256 mintFee = 0.001 ether;

    // deklarasi event
    event ProductMinted(uint256 tokenId, string name, string batchNumber, address supplier);
    event StatusUpdated(uint256 tokenId, string newStatus);
    event SupplierAdded(address supplier);
    event SupplierRemoved(address supplier);

    constructor() ERC721("SupplyChainNFT", "SCNFT") Ownable(msg.sender) {
    }

    // tambah supplier baru oleh admin/pusat
    function addSupplier(address _supplier) external onlyOwner {
        require(_supplier != address(0), "Invalid address");
        verifiedSuppliers[_supplier] = true;
        emit SupplierAdded(_supplier);
    }

    // hapus supplier oleh admin/pusat
    function removeSupplier(address _supplier) external onlyOwner {
        require(verifiedSuppliers[_supplier], "Supplier not found");
        verifiedSuppliers[_supplier] = false;
        emit SupplierRemoved(_supplier);
    }

    // mint NFT baru oleh supplier resmi
    function mintProduct(string calldata _name, string calldata _origin, string calldata _batchNumber, uint256 _quantityKg, string calldata _metadataURI) external payable {
        require(msg.value >= mintFee, "Mint fee required");
        require(verifiedSuppliers[msg.sender], "Not a verified supplier");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_origin).length > 0, "Origin required");
        require(bytes(_batchNumber).length > 0, "Batch number required");
        require(_quantityKg > 0, "Quantity must be greater than zero");
        require(bytes(_metadataURI).length > 0, "Metadata URI required");

        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);

        products[tokenId] = Product({
            name: _name,
            origin: _origin,
            batch_number: _batchNumber,
            quantity_kg: _quantityKg,
            metadataURI: _metadataURI, // description + production_date
            currentStatus: "Created by supplier",
            supplier: msg.sender,
            createdAt: block.timestamp
        });

        uint256 refund = msg.value - mintFee;

        // kirim mintFee ke owner
        (bool sent, ) = owner().call{value: mintFee}("");
        require(sent, "Failed to send mint fee");

        // refund ke supplier kalau kelebihan bayar
        if (refund > 0) {
            (bool refunded, ) = msg.sender.call{value: refund}("");
            require(refunded, "Refund failed");
        }

        emit ProductMinted(tokenId, _name, _batchNumber, msg.sender);
    }

    // update status hanya boleh oleh supplier asli atau pemilik token saat ini
    function updateStatus(uint256 _tokenId, string memory _newStatus) external {
        require(
            msg.sender == ownerOf(_tokenId) || msg.sender == products[_tokenId].supplier,
            "Not authorized"
        );
        products[_tokenId].currentStatus = _newStatus;
        emit StatusUpdated(_tokenId, _newStatus);
    }

    // dapatkan detail produk
    function getProduct(uint256 _tokenId) external view returns (Product memory) {
        return products[_tokenId];
    }
}