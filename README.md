# SupplyChainNFT — Technical Documentation

SupplyChainNFT is an ERC-721 smart contract designed to represent real-world supply chain products as NFTs.  
This document focuses on **technical architecture, access control, state transitions, and security considerations** to support auditing and formal review.

---

## Contract Summary

- **Name:** SupplyChainNFT
- **Standard:** ERC-721
- **Solidity Version:** ^0.8.28
- **Libraries:** OpenZeppelin ERC721, Ownable
- **Mint Fee:** 0.0005 ETH
- **Network:** EVM-compatible

---

## Architecture Overview

Each product is represented by **one ERC-721 token**.  
Product metadata and supply chain state are stored on-chain in a `Product` struct mapped to `tokenId`.

High-level flow:
1. Owner registers verified suppliers
2. Verified supplier mints product NFT
3. NFT is transferred between actors
4. Product status is updated on each transfer

---

## Data Structures

### Product Struct

```solidity
struct Product {
    string name;
    string origin;
    string batch_number;
    uint256 quantity_kg;
    string metadataURI;
    string currentStatus;
    address supplier;
    address currentHolder;
    uint256 createdAt;
}
```

### Storage Variables
| Variable            | Type                        | Description                     |
| ------------------- | --------------------------- | ------------------------------- |
| `products`          | mapping(uint256 => Product) | Stores product data per tokenId |
| `verifiedSuppliers` | mapping(address => bool)    | Whitelisted suppliers           |
| `nextTokenId`       | uint256                     | Auto-increment token ID         |
| `mintFee`           | uint256                     | Required ETH fee to mint        |

### Access Control
| Function          | Access            |
| ----------------- | ----------------- |
| `addSupplier`     | Contract Owner    |
| `removeSupplier`  | Contract Owner    |
| `mintProduct`     | Verified Supplier |
| `transferProduct` | Token Owner       |

Access control is enforced via:
Ownable (OpenZeppelin)
Explicit require checks
