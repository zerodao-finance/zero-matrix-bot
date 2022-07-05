const {
  MatrixClient,
  MatrixAuth,
  SimpleFsStorageProvider,
  AutojoinRoomsMixin,
  RustSdkCryptoStorageProvider,
} = require("matrix-bot-sdk");
require("olm");
const os = require("os");
const util = require("util");
const _ = require("lodash");
const hash = require("object-hash");
// const {
//   getChainName,
//   getAssetMain,
//   getAssetArb,
//   getAssetAva,
//   getAssetPoly,
// } = require("./helper");
const ethers = require("ethers");
const MatrixBot = (exports.MatrixBot = class MatrixBot {
  constructor({ homeserverUrl, redis }) {
    const storage = new SimpleFsStorageProvider("./storage/simple.json");
    const cryptoStorage = new RustSdkCryptoStorageProvider("./storage");
    let client;
    let queueLength;
    Object.assign(this, {
      homeserverUrl,
      storage,
      cryptoStorage,
      redis,
    });
  }

  async run() {
    this.queueLength = await this.redis.llen("/zero/request");
    const _client = await new MatrixAuth(this.homeserverUrl).passwordLogin(
      "keeperbot",
      "dcZXwevW2ZNY82",
      "keeperbot"
    );
    const accessToken = _client.accessToken;
    this.client = await new MatrixClient(
      this.homeserverUrl,
      accessToken,
      this.storage,
      this.cryptoStorage
    );
    await AutojoinRoomsMixin.setupOnClient(this.client);
    await this.client.start().then(async () => {
      console.log(this.client.crypto.isReady);
    });

    this.client.on("room.message", async (roomId, event) => {
      console.log(event);
      if (event["content"]?.["msgtype"] !== "m.text") return; //don't repond to non-text messages
      if (event["sender"] === (await this.client.getUserId())) return; //dont respond to own messages

      const body = event["content"]["body"];
      if (body?.startsWith("!hello")) {
        await this.client.replyNotice(roomId, event, "Hello World");
      }
    });
  }

  async listen() {
    let newLength = await this.redis.llen("/zero/request");
    try {
      // if (newLength > this.queueLength) {
      // for (let i = this.queueLength; i < newLength; i++) {
      for (let i = 200; i < this.queueLength; i++) {
        const request = await this.redis.lindex("/zero/request", i);
        const event = JSON.parse(request);
        const { requestType, chainId, asset, amount, destination, owner, to } =
          event;
        let chain = await this.getChainName(chainId);
        let assetAddr = await ethers.utils.getAddress(asset);
        let assetName;
        const DECIMALS = new Map([
          ["USDC", "6"],
          ["WBTC", "8"],
          ["renBTC", "8"],
          ["ETH", "18"],
          ["AVAX", "18"],
          ["MATIC", "18"],
        ]);
        let message;
        if (chain == "Mainnet") {
          assetName = await this.getAssetMain(assetAddr);
        } else if (chain == "Arbitrum") {
          assetName = await this.getAssetArb(assetAddr);
        }
        if (chain == "Avalanche") {
          assetName = await this.getAssetAva(assetAddr);
        }
        if (chain == "Polygon") {
          assetName = await this.getAssetPoly(assetAddr);
        }
        if (requestType == "burn") {
          let formAmount = await ethers.utils.formatUnits(
            amount,
            DECIMALS[assetAddr]
          );
          message =
            "Burn" +
            "|" +
            chain +
            "|" +
            formAmount +
            " " +
            assetName +
            "|" +
            "Owner: " +
            owner +
            "|" +
            "Destination: " +
            destination;
        }
        if (requestType == "transfer") {
          let formAmount = await ethers.utils.formatUnits(amount, "8");
          message =
            "Mint" +
            "|" +
            chain +
            "|" +
            formAmount +
            " BTC => " +
            assetName +
            "|" +
            "Destination: " +
            to;
        }
        console.log(message);
        await this.sendGeneral(message);
        // }
        this.queueLength = newLength;
        // }
      }
    } catch (error) {
      console.log(error);
      return;
    }
  }
  async runLoop() {
    while (true) {
      await this.listen();
      await this.timeout(1000);
    }
  }
  async sendGeneral(msg) {
    await this.client.sendText("!qUZokxLhRuodqYwwwg:matrix.zerodao.gg", msg);
  }
  async sendAll(msg) {
    let rooms = await this.client.getJoinedRooms();
    await rooms.forEach(async (roomId) => {
      await this.client.sendText(roomId, msg);
    });
  }

  async timeout(ms) {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getChainName(chainId) {
    switch (chainId) {
      case "42161":
        return "Arbitrum";
      case "43114":
        return "Avalanche";
      case "137":
        return "Polygon";
      default:
        return "Mainnet";
    }
  }

  async getAssetMain(address) {
    switch (address) {
      case [
        ethers.utils.getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
      ]:
        return "USDC";
      case [
        ethers.utils.getAddress("0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D"),
      ]:
        return "renBTC";
      case [
        ethers.utils.getAddress("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"),
      ]:
        return "WBTC";
      default:
        return "ETH";
    }
  }
  async getAssetArb(address) {
    switch (address) {
      case [
        ethers.utils.getAddress("0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"),
      ]:
        return "USDC";
      case [
        ethers.utils.getAddress("0xDBf31dF14B66535aF65AaC99C32e9eA844e14501"),
      ]:
        return "renBTC";
      case [
        ethers.utils.getAddress("0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"),
      ]:
        return "WBTC";
      default:
        return "ETH";
    }
  }
  async getAssetAva(address) {
    switch (address) {
      case [
        ethers.utils.getAddress("0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664"),
      ]:
        return "USDC";
      case [
        ethers.utils.getAddress("0xDBf31dF14B66535aF65AaC99C32e9eA844e14501"),
      ]:
        return "renBTC";
      case [
        ethers.utils.getAddress("0x50b7545627a5162F82A992c33b87aDc75187B218"),
      ]:
        return "WBTC";
      default:
        return "AVAX";
    }
  }

  async getAssetPoly(address) {
    switch (address) {
      case [
        ethers.utils.getAddress("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"),
      ]:
        return "USDC";
      case [
        ethers.utils.getAddress("0xDBf31dF14B66535aF65AaC99C32e9eA844e14501"),
      ]:
        return "renBTC";
      case [
        ethers.utils.getAddress("0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"),
      ]:
        return "WBTC";
      default:
        return "MATIC";
    }
  }
});
