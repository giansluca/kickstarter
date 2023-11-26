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
        providerUrl: process.env.PROVIDER_URL,
        accountAddress: process.env.ACCOUNT_ADDRESS,
        accountPrivateKey: process.env.ACCOUNT_PRIVATE_KEY
    },
};

module.exports = config;
