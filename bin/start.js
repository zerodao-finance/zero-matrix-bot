const { MatrixBot } = require("../lib/bot");
const redis = new (require('ioredis'))();



(async () => {
  let bot = new MatrixBot({
    homeserverUrl: "https://matrix.zerodao.gg",
    redis: redis,
  });
  await bot.run();
  await bot.runLoop();
})();
