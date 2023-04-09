const path = require("path");
const solc = require("solc");
const fs = require("fs-extra");

const buildPath = path.resolve(__dirname, "../contracts/build");
fs.removeSync(buildPath);

const campaignPath = path.resolve(__dirname, "../contracts/src", "Campaign.sol");
const source = fs.readFileSync(campaignPath, "utf8");

var input = {
    language: "Solidity",
    sources: {
        "campaign.sol": {
            content: source,
        },
    },
    settings: {
        outputSelection: {
            "*": {
                "*": ["*"],
            },
        },
    },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

fs.ensureDirSync(buildPath);
const contracts = output.contracts["campaign.sol"];
for (let contract in contracts) {
    const contractData = contracts[`${contract}`];
    const contractPath = path.resolve(buildPath, `${contract}.json`);
    fs.outputJsonSync(contractPath, contractData);
}
