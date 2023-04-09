const ENV = process.env.ENV || "dev";
if (ENV !== "prod") {
    require("dotenv").config();
}

const pkg = require("../package");

const config = {
    env: process.env.ENV || "local",
    app: {
        name: process.env.APP_NAME || "kickstarter",
        version: pkg.version,
        commit: process.env.APP_COMMIT,
    },
    wallet: {
        privateKey: process.env.PRIVATE_KEY,
        account: process.env.GOERLI_ACCOUNT_2,
        providerUrl: process.env.PROVIDER_URL,
    },
};

module.exports = config;
