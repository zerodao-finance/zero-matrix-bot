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

const MatrixBot = (exports.MatrixBot = class MatrixBot {
  constructor({ homeserverUrl, redis }) {
    const storage = new SimpleFsStorageProvider("./storage/simple.json");
    const cryptoStorage = new RustSdkCryptoStorageProvider("./storage");
    let client;
    let queueLength
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
      if (newLength > this.queueLength) {
        let difference = newLength - this.queueLength;
        for (let i = queueLength; i < newLength; i++) {
          const request = await this.redis.lindex("/zero/request", i);
          const event = JSON.parse(request);
          const fin = util.inspect(request, { colors: true, depth: 2 });
          await this.sendGeneral(fin);
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
