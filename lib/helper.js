const ethers = require("ethers");

exports.getChainName = function getChainName(chainId) {
  console.log("chainId", chainId);
  switch (Number(chainId)) {
    case 42161:
      return "Arbitrum";
    case 43114:
      return "Avalanche";
    case 137:
      return "Polygon";
    case 10:
      return "Optimism";
    default:
      return "Mainnet";
  }
};
