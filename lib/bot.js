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
const ethers = require("ethers");
const formatDestination = (s) => s.substr(0, 8) === '0x626331' ? Buffer.from(s.substr(2), 'hex').toString('utf8') : ethers.utils.base58.encode(s);
const path = require('path');
const mkdirp = require('mkdirp');
const MatrixBot = (exports.MatrixBot = class MatrixBot {
  static get storageDirectory() {
    return path.join(process.env.HOME, '.matrix-bot', 'storage');
  }
  constructor({ homeserverUrl, redis }) {
    mkdirp.sync(this.constructor.storageDirectory);
    const storage = new SimpleFsStorageProvider(path.join(this.constructor.storageDirectory, 'simple.json'));
    const cryptoStorage = new RustSdkCryptoStorageProvider(this.constructor.storageDirectory);
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
      process.env.MATRIX_BOT_USERNAME,
      process.env.MATRIX_BOT_PASSWORD,
      process.env.MATRIX_BOT_USERNAME
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
      if (newLength > this.queueLength) {
        let difference = newLength - this.queueLength;
        for (let i = difference - 1; i >= 0; i--) {
          const request = await this.redis.lindex("/zero/request", i);
          const event = JSON.parse(request);
          const {
            requestType,
            chainId,
            asset,
            amount,
            destination,
            owner,
            to,
          } = event;
          let chain = await this.getChainName(chainId);
          let assetAddr = await ethers.utils.getAddress(asset);
          let assetName;
          const DECIMALS = [
            ["USDC", "6"],
            ["WBTC", "8"],
            ["renBTC", "8"],
            ["ETH", "18"],
            ["AVAX", "18"],
            ["MATIC", "18"],
          ].reduce((r, [ key, value ]) => {
            r[key] = value;
            return r;
          }, {});
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
              DECIMALS[assetName]
            );
            message = `
            <samp>
            <h3>Burn</h3>
            Chain: ${chain}<br>
            Amount: ${formAmount} ${assetName}<br>
            Owner: ${owner}<br>
            Destination: ${formatDestination(destination)}<br>
            </samp>`;
          }
          if (requestType == "transfer") {
            let formAmount = await ethers.utils.formatUnits(amount, "8");
            message = `
            <samp>
            <h3>Mint</h3>
            Chain: ${chain}<br>
            Amount: ${formAmount} BTC => ${assetName}<br>
            Destination: ${to}<br>
            </samp>`;
          }
          console.log(message);
          await this.sendGeneral(message);
        }
        this.queueLength = newLength;
      }
    } catch (error) {
      console.log(error);
      return;
    }
  }
  async runLoop() {
    while (true) {
      await this.listen();
      await this.timeout(100000);
    }
  }
  async sendGeneral(msg) {
    await this.client.sendHtmlText(
      process.env.MATRIX_BOT_ROOMNAME,
      msg
    );
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
    console.log('chainId', chainId);
    switch (Number(chainId)) {
      case 42161:
        return "Arbitrum";
      case 43114:
        return "Avalanche";
      case 137:
        return "Polygon";
      case 10:
        return "Optimism"
      default:
        return "Mainnet";
    }
  }

  async getAssetMain(address) {
    switch (ethers.utils.getAddress(address)) {
      case "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48":
        return "USDC";
      case "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D":
        return "renBTC";
      case "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599":
        return "WBTC";
      default:
        return "ETH";
    }
  }
  async getAssetArb(address) {
    switch (ethers.utils.getAddress(address)) {
      case "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8":
        return "USDC";
      case "0xDBf31dF14B66535aF65AaC99C32e9eA844e14501":
        return "renBTC";
      case "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f":
        return "WBTC";
      default:
        return "ETH";
    }
  }
  async getAssetAva(address) {
    switch (ethers.utils.getAddress(address)) {
      case "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664":
        return "USDC";
      case "0xDBf31dF14B66535aF65AaC99C32e9eA844e14501":
        return "renBTC";
      case "0x50b7545627a5162F82A992c33b87aDc75187B218":
        return "WBTC";
      default:
        return "AVAX";
    }
  }

  async getAssetPoly(address) {
    switch (ethers.utils.getAddress(address)) {
      case "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174":
        return "USDC";
      case "0xDBf31dF14B66535aF65AaC99C32e9eA844e14501":
        return "renBTC";
      case "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6":
        return "WBTC";
      default:
        return "MATIC";
    }
  }
});
