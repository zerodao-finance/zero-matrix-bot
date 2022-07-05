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
const {
  getChainName,
  getAssetMain,
  getAssetArb,
  getAssetAva,
  getAssetPoly,
} = require("./helper");
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
    const request = await this.redis.lindex("/zero/request", 0);
    const event = JSON.parse(request);
    const { requestType, chainId, asset, amount, owner, to } = event;
    let chain = await getChainName(chainId);
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
      assetName = await getAssetMain(assetAddr);
    } else if (chain == "Arbitrum") {
      assetName = await getAssetArb(assetAddr);
    }
    if (chain == "Avalanche") {
      assetName = await getAssetAva(assetAddr);
    }
    if (chain == "Polygon") {
      assetName = await getAssetPoly(assetAddr);
    }
    if (requestType == "burn") {
      let formAmount = await ethers.utils.formatUnits(
        amount,
        DECIMALS[assetAddr]
      );
      message =
        requestType +
        "|" +
        chain +
        "|" +
        formAmount +
        " " +
        assetName +
        "|" +
        owner +
        "|" +
        to;
    }
    if (requestType == "transfer") {
      let formAmount = await ethers.utils.formatUnits(amount, "8");
      message =
        requestType +
        "|" +
        chain +
        "|" +
        formAmount +
        " BTC => " +
        assetName +
        "|" +
        to;
    }
    console.log(message);
    // try {
    //   if (newLength > this.queueLength) {
    //     let difference = newLength - this.queueLength;
    //     for (let i = this.queueLength; i < newLength; i++) {
    //       const request = await this.redis.lindex("/zero/request", i);
    //       const event = JSON.parse(request);
    //       const fin = util.inspect(request, { colors: true, depth: 2 });
    //       await this.sendGeneral(fin);
    //     }
    //     this.queueLength = newLength;
    //   }
    // } catch (error) {
    //   console.log(error);
    //   return;
    // }
  }
  async runLoop() {
    while (true) {
      await this.listen();
      await this.timeout(1000);
    }
  }
  async sendGeneral(msg) {
    await this.client.sendText("!utjhpieYKaZJxTIYWQ:matrix.zerodao.gg", msg);
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
});
