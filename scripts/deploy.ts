import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
    const [deployer] = await ethers.getSigners();

    const SupplyChainFarm = await ethers.getContractFactory("SupplyChainNFT");
    const supplyChainFarm = await SupplyChainFarm.deploy();
    await supplyChainFarm.waitForDeployment();

    console.log("SupplyChain deployed to:", supplyChainFarm.target);
    console.log("Deployer address:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});