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

exports.getLink = function getLink(chainId) {
  switch (Number(chainId)) {
    case 42161:
      return "https://arbiscan.io/";
    case 43114:
      return "https://snowtrace.io/";
    case 137:
      return "https://polygonscan.com/";
    case 10:
      return "https://optimistic.etherscan.io/";
    default:
      return "https://etherscan.io/";
  }
};

