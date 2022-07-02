const {MatrixBot} = require("../lib/bot");

class emptyRedis {
    constructor(){

    }

    doNothing() {
        return null
    }
}

( async () => {
    // console.log(process.env.HOME)
    let bot = new MatrixBot({homeserverUrl: 'https://matrix.zerodao.gg', redis: new emptyRedis()})
    // console.log(await bot.getMatrixInfo())
    await bot.run()
})();