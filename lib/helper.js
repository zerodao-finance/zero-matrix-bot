const ethers = require('ethers');


export function getChainName(chainId) { // I think this can be non-async and we can import from helper.js? 
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
