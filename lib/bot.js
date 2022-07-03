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

    Object.assign(this, {
      homeserverUrl,
      storage,
      cryptoStorage,
      redis,
    });
  }

  async getMatrixInfo() {
    return await this.client.getJoinedRooms();
  }

  async run() {
    const _client = await new MatrixAuth(this.homeserverUrl).passwordLogin(
      "keeperbot",
      "dcZXwevW2ZNY82",
      "keeperbot"
    );
    const accessToken = _client.accessToken;
    let client = new MatrixClient(
      this.homeserverUrl,
      accessToken,
      this.storage,
      this.cryptoStorage
    );
    AutojoinRoomsMixin.setupOnClient(client);
    client.start().then(async () => {
      console.log(client.crypto.isReady);
    });

    client.on("room.message", async (roomId, event) => {
      console.log(event);
      if (event["content"]?.["msgtype"] !== "m.text") return; //don't repond to non-text messages
      if (event["sender"] === (await client.getUserId())) return; //dont respond to own messages

      const body = event["content"]["body"];
      if (body?.startsWith("!hello")) {
        await client.replyNotice(roomId, event, "Hello World");
      }
    });
  }

  async listen() {
    try {
      if (await this.redis.llen("/zero/request")) {
        for (let i = 0; i < (await this.redis.llen("/zero/request")); i++) {
          const request = await this.redis.lindex("/zero/request", i);
          const event = JSON.parse(request);
          const fin = util.inspect(request, { colors: true, depth: 2 });
          await sendAll(fin);
        }
      }
    } catch (error) {
      this.logger.error(error);
      return;
    }
  }
  async runLoop() {
    while (true) {
      await this.listen();
      await this.timeout(10000);
    }
  }

  async sendAll(msg) {
    getMatrixInfo().map(async (roomId) => {
      await client.sendText(roomId, msg);
    });
  }

  async timeout(ms) {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  }
});
