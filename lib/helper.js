const ethers = require('ethers');


export const getChainName = (chainId) => {
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
};

export const getAssetMain = (address) => {
  switch (address) {
    case ethers.utils.getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"):
      return "USDC";
    case ethers.utils.getAddress("0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D"):
      return "renBTC";
    case ethers.utils.getAddress("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"):
      return "WBTC";
    default:
      return "ETH";
  }
};
export const getAssetArb = (address) => {
  switch (address) {
    case ethers.utils.getAddress("0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"):
      return "USDC";
    case ethers.utils.getAddress("0xDBf31dF14B66535aF65AaC99C32e9eA844e14501"):
      return "renBTC";
    case ethers.utils.getAddress("0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"):
      return "WBTC";
    default:
      return "ETH";
  }
};
export const getAssetAva = (address) => {
  switch (address) {
    case ethers.utils.getAddress("0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664"):
      return "USDC";
    case ethers.utils.getAddress("0xDBf31dF14B66535aF65AaC99C32e9eA844e14501"):
      return "renBTC";
    case ethers.utils.getAddress("0x50b7545627a5162F82A992c33b87aDc75187B218"):
      return "WBTC";
    default:
      return "AVAX";
  }
};
export const getAssetPoly = (address) => {
  switch (address) {
    case ethers.utils.getAddress("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"):
      return "USDC";
    case ethers.utils.getAddress("0xDBf31dF14B66535aF65AaC99C32e9eA844e14501"):
      return "renBTC";
    case ethers.utils.getAddress("0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"):
      return "WBTC";
    default:
      return "MATIC";
  }
};
