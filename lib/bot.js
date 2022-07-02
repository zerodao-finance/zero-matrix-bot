const { 
    MatrixClient, 
    MatrixAuth,
    SimpleFsStorageProvider,
    AutojoinRoomsMixin,
    RustSdkCryptoStorageProvider
} = require("matrix-bot-sdk");
require("olm");

const _ = require("lodash")
const hash = require('object-hash');


const MatrixBot = (exports.MatrixBot = class MatrixBot {
    constructor({ homeserverUrl, redis}) {

        const storage = new SimpleFsStorageProvider("./simplestorage.json");
        const cryptoStorage = new RustSdkCryptoStorageProvider("./storage");
        
        Object.assign(this, {
            homeserverUrl,
            storage,
            cryptoStorage,
            redis
        })
        
    }
    
    
   
     async getMatrixInfo() {
                return await this.client.getJoinedRooms()
            }
            
    async run() {
        const _client = await (new MatrixAuth(this.homeserverUrl)).passwordLogin("keeperbot", "dcZXwevW2ZNY82", "keeperbot")
        const accessToken = _client.accessToken
        let client = new MatrixClient(this.homeserverUrl, accessToken, this.storage, this.cryptoStorage)
        AutojoinRoomsMixin.setupOnClient(client)
        client.start().then(async () => {
            console.log(client.crypto.isReady)
            
        })


        
    client.on("room.message", (roomId, event) => {
        console.log(event);
        if (event['content']?.['msgtype'] !== 'm.text') return; //don't repond to non-text messages
        if (event['sender'] === await client.getUserId()) return; //dont respond to own messages

        const body  = event['content']['body'];
        if (body?.startsWith("!hello")) {
        await client.replyNotice(roomId, event, "Hello World")}
    })
        
        
    }
    
    async sendAll(msg) {
        getMatrixInfo().map((roomId) => {
            await client.sendText(roomId, msg)
        })

    }
    async handleCommand(roomId, event) {
        if (event['content']?.['msgtype'] !== 'm.text') return; //don't repond to non-text messages
        if (event['sender'] === await client.getUserId()) return; //dont respond to own messages

        const body  = event['content']['body'];
        if (!body?.startsWith("!hello")) return;
        
        await client.replyNotice(roomId, event, "Hello World")
    }


})


