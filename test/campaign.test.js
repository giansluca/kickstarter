const ganache = require("ganache");
const Web3 = require("web3");

const compiledFactory = require("../contracts/build/CampaignFactory.json");
const compiledCampaign = require("../contracts/build/Campaign.json");

const options = { logging: { quiet: true } };
const provider = ganache.provider(options);
const web3 = new Web3(provider);

let accounts;
let factory;
let factoryOwner;
let campaign;
let campaignAddress;
let campaignManager;

describe("Test contract", () => {
    beforeEach(async () => {
        accounts = await web3.eth.getAccounts();
        factoryOwner = accounts[9];
        campaignManager = accounts[0];

        factory = await new web3.eth.Contract(compiledFactory.abi)
            .deploy({ data: compiledFactory.evm.bytecode.object })
            .send({ from: factoryOwner, gas: "3000000" });

        const minimumContribution = web3.utils.toWei("0.2", "ether");
        await factory.methods.deployCampaign(minimumContribution).send({
            from: campaignManager,
            gas: "2000000",
        });

        const addresses = await factory.methods.getDeployedCampaigns().call();
        campaignAddress = addresses[0];
        campaign = await new web3.eth.Contract(compiledCampaign.abi, campaignAddress);
    });

    it("should deploy a factory and a campaign", () => {
        // Given - When - Then
        expect(factory.options.address).toBeDefined();
        expect(campaign.options.address).toBeDefined();
    });

    it("should mark the caller as the campaign manager", async () => {
        // Given - When
        const manager = await campaign.methods.manager().call();

        // Then
        expect(manager).toBe(campaignManager);
    });

    it("should allow people to contribute and mark them as approvers", async () => {
        // Given
        const contributor1 = accounts[1];
        const contribution = web3.utils.toWei("0.21", "ether");

        // When
        await campaign.methods.contribute().send({
            from: contributor1,
            value: contribution,
        });

        const isContributor = await campaign.methods.approvers(contributor1).call();

        // Then
        expect(isContributor).toBeTruthy();
    });

    it("should require a minimum contribution", async () => {
        // Given
        const contributor1 = accounts[1];
        const contribution = web3.utils.toWei("0.19", "ether");

        // When - Then
        try {
            await campaign.methods.contribute().send({
                from: contributor1,
                value: contribution,
            });
        } catch (e) {
            expect(e).toBeDefined();
            return;
        }

        throw new Error("it should not reach here");
    });

    it("should allow manager to take a payment request", async () => {
        // Given
        const recipient = accounts[5];
        const requestAmount = web3.utils.toWei("0.5", "ether");

        await campaign.methods.createRequest("Buy batteries", requestAmount, recipient).send({
            from: campaignManager,
            gas: "1000000",
        });

        // When
        const request = await campaign.methods.requests(0).call();

        // Then
        expect(request.description).toBe("Buy batteries");
        expect(request.value).toBe(web3.utils.toWei("0.5", "ether"));
    });

    it("should process requests", async () => {
        // Given
        const contributor1 = accounts[1];
        const contributor2 = accounts[2];
        const contributor3 = accounts[3];
        const recipient = accounts[5];

        let recipientBalanceBefore = await web3.eth.getBalance(recipient);
        recipientBalanceBefore = web3.utils.fromWei(recipientBalanceBefore, "ether");

        // When
        await campaign.methods.contribute().send({
            from: contributor1,
            value: web3.utils.toWei("0.5", "ether"),
        });

        await campaign.methods.contribute().send({
            from: contributor2,
            value: web3.utils.toWei("1.2", "ether"),
        });

        await campaign.methods.contribute().send({
            from: contributor3,
            value: web3.utils.toWei("0.8", "ether"),
        });

        await campaign.methods.createRequest("Buy car", web3.utils.toWei("1.5", "ether"), recipient).send({
            from: campaignManager,
            gas: "1000000",
        });

        const requestIndex = 0;
        await campaign.methods.approveRequest(requestIndex).send({
            from: contributor1,
            gas: "1000000",
        });
        await campaign.methods.approveRequest(requestIndex).send({
            from: contributor2,
            gas: "1000000",
        });

        await campaign.methods.finalizeRequest(0).send({
            from: campaignManager,
            gas: "1000000",
        });

        let recipientBalance = await web3.eth.getBalance(recipient);
        recipientBalance = web3.utils.fromWei(recipientBalance, "ether");

        // Then
        const expectedTransferredEthAmount = 1.5;
        expect(recipientBalance - recipientBalanceBefore).toBe(expectedTransferredEthAmount);
    });
});
