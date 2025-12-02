import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("SupplyChain", () => {
    let deployer: any, supplier: any, distributor: any
    let supplyChain: any
    let balanceBefore: any, balanceAfter: any

    beforeEach(async () => {
        [deployer, supplier, distributor] = await ethers.getSigners()

        const SupplyChainFactory = await ethers.getContractFactory("SupplyChainNFT")
        supplyChain = await SupplyChainFactory.deploy()
        supplyChain = await supplyChain.waitForDeployment()

        // add deployer as a verifiedSupplier
        await supplyChain.connect(deployer).addSupplier(supplier.address)

        balanceBefore = await ethers.provider.getBalance(deployer.address)

        // mint an NFT(product) as a supplier
        await supplyChain.connect(supplier).mintProduct(
            "Kopi Arabica", // name
            "Toraja, Sulawesi Selatan", // origin
            "1", // batchNumber
            100, // quantity_kg
            "ipfs://bafybeicw5okhl2hng2oqwnqsrrtd62unewcr3gjdry2msofdnyfcnng3vq/0.json", // metadata URI = description + production_date
            { value: ethers.parseEther("0.001") } // mint fee
        )

        balanceAfter = await ethers.provider.getBalance(deployer.address)
    })

    describe("Deployment", () => {
        it("Sets the name and symbol correctly", async() => {
            let name = await supplyChain.name()
            let symbol = await supplyChain.symbol()
            expect(name).to.equal("SupplyChainNFT")
            expect(symbol).to.equal("SCNFT")
        })

        it("Sets the deployer", async() => {
            let result = await supplyChain.owner()
            expect(result).to.equal(deployer.address)
        })

        it("Check deployer is a verified supplier", async() => {
            let result = await supplyChain.verifiedSuppliers(supplier.address)
            expect(result).to.equal(true)
        })

        it("Check next token id", async() => {
            let tokenId = await supplyChain.nextTokenId()
            expect(tokenId).to.equal(2)
        })

        it("Check product details", async() => {
            let product = await supplyChain.products(1)
            expect(product.name).to.equal("Kopi Arabica")
            expect(product.origin).to.equal("Toraja, Sulawesi Selatan")
            expect(product.batch_number).to.equal("1")
            expect(product.quantity_kg).to.equal(100)
            expect(product.metadataURI).to.equal("ipfs://bafybeicw5okhl2hng2oqwnqsrrtd62unewcr3gjdry2msofdnyfcnng3vq/0.json")
            expect(product.currentStatus).to.equal("Created by supplier")
            expect(product.supplier).to.equal(supplier.address)
        })

        it("Check wallet deployer balance after minting by supplier", async() => {
            expect(balanceAfter).to.equal(balanceBefore + ethers.parseEther("0.001"))
        })
    })

    describe("Update status by supplier", () => {
        beforeEach(async () => {
            // update status to "shipped to distributor" by supplier and transfer the NFT to distributor
            await supplyChain.connect(supplier).updateStatus(1, "Shipped to distributor")
            await supplyChain.connect(supplier).safeTransferFrom(supplier.address, distributor.address, 1)
        })

        it("Check updated product status", async() => {
            let product = await supplyChain.products(1)
            expect(product.currentStatus).to.equal("Shipped to distributor")
        })

        // const [products, setProducts] = useState([])
        // for(i = 0; i < supplyChain.nextTokenId(); i++) {
        //    const product = await supplyChain.products(i)
        //    setProducts(product)
        // }

        it("Check product details", async() => {
            let product = await supplyChain.products(1)
            expect(product.name).to.equal("Kopi Arabica")
            expect(product.origin).to.equal("Toraja, Sulawesi Selatan")
            expect(product.batch_number).to.equal("1")
            expect(product.quantity_kg).to.equal(100)
            expect(product.metadataURI).to.equal("ipfs://bafybeicw5okhl2hng2oqwnqsrrtd62unewcr3gjdry2msofdnyfcnng3vq/0.json")
            expect(product.currentStatus).to.equal("Shipped to distributor")
            expect(product.supplier).to.equal(supplier.address)
        })

        it("Check new owner of the token", async() => {
            let result = await supplyChain.ownerOf(1)
            expect(result).to.equal(distributor.address)
        })
    })

    describe("Update status by distributor", () => {
        beforeEach(async () => {
            await supplyChain.connect(supplier).safeTransferFrom(supplier.address, distributor.address, 1)
            await supplyChain.connect(distributor).updateStatus(1, "Stored at distributor warehouse")
        })

        it("Check updated product status", async() => {
            let product = await supplyChain.products(1)
            expect(product.currentStatus).to.equal("Stored at distributor warehouse")
        })

        it("Check product details", async() => {
            let product = await supplyChain.products(1)
            expect(product.name).to.equal("Kopi Arabica")
            expect(product.origin).to.equal("Toraja, Sulawesi Selatan")
            expect(product.batch_number).to.equal("1")
            expect(product.quantity_kg).to.equal(100)
            expect(product.metadataURI).to.equal("ipfs://bafybeicw5okhl2hng2oqwnqsrrtd62unewcr3gjdry2msofdnyfcnng3vq/0.json")
            expect(product.currentStatus).to.equal("Stored at distributor warehouse")
            expect(product.supplier).to.equal(supplier.address)
        })
    })
})