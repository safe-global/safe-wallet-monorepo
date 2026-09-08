/**
 * Curated "popular tokens" per chain for the spending-limit token selector (WA-3149, AC C14).
 *
 * Coverage: the six highest-traffic chains that expose SPENDING_LIMIT (Ethereum, BNB Chain, Base,
 * Polygon, Gnosis, Avalanche — 95% of spending-limit-eligible traffic in safe-client-gateway
 * production logs, 7 days to 2026-09-08) plus Sepolia. Other chains fall back to the Safe's own
 * tokens and the native currency, which is synthesised from `chain.nativeCurrency` and therefore
 * deliberately absent here.
 *
 * Every address, `decimals` and `logoUri` was verified on 2026-09-08 with
 * `GET <transactionService>/api/v1/tokens/<address>/` on that chain's Transaction Service.
 * `symbol` is the common ticker (the service sometimes differs, e.g. Gnosis WXDAI is "XDAI" there);
 * `name` is the service's. Full audit: docs/superpowers/specs/2026-09-08-wa-3149-popular-tokens-audit.md
 *
 * Re-verify the same way before editing. Keys are `ChainInfo.chainId` strings.
 */
export type PopularToken = {
  symbol: string
  name: string
  /** EIP-55 checksummed, exactly as the Transaction Service returns it. */
  address: string
  decimals: number
  logoUri: string
}

const SAFE_ASSETS = 'https://safe-transaction-assets.safe.global/tokens/logos'
const COINGECKO = 'https://assets.coingecko.com/coins/images'
const SMOLD = 'https://assets.smold.app/api/token'

export const POPULAR_TOKENS: Record<string, readonly PopularToken[]> = {
  // Ethereum
  '1': [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      logoUri: `${SMOLD}/1/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo-128.png`,
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      logoUri: `${SMOLD}/1/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo-128.png`,
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
      logoUri: `${SAFE_ASSETS}/0x6B175474E89094C44Da98b954EedeAC495271d0F.png`,
    },
    {
      symbol: 'USDS',
      name: 'USDS Stablecoin',
      address: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
      decimals: 18,
      logoUri: `${SMOLD}/1/0xdC035D45d973E3EC169d2276DDab16f1e407384F/logo-128.png`,
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
      logoUri: `${SMOLD}/1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo-128.png`,
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
      logoUri: `${SMOLD}/1/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo-128.png`,
    },
    {
      symbol: 'cbBTC',
      name: 'Coinbase Wrapped BTC',
      address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
      decimals: 8,
      logoUri: `${COINGECKO}/40143/thumb/cbbtc.webp?1726136727`,
    },
    {
      symbol: 'SAFE',
      name: 'Safe Token',
      address: '0x5aFE3855358E112B5647B952709E6165e1c1eEEe',
      decimals: 18,
      logoUri: `${SAFE_ASSETS}/0x5aFE3855358E112B5647B952709E6165e1c1eEEe.png`,
    },
  ],
  // BNB Chain — note: stablecoins, BTCB and ETH carry 18 decimals here
  '56': [
    {
      symbol: 'USDT',
      name: 'Binance Bridged USDT (BNB Smart Chain)',
      address: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18,
      logoUri: `${COINGECKO}/35021/thumb/USDT.png?1707233575`,
    },
    {
      symbol: 'USDC',
      name: 'Binance Bridged USDC (BNB Smart Chain)',
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      decimals: 18,
      logoUri: `${COINGECKO}/35220/thumb/USDC.jpg?1707919050`,
    },
    {
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      decimals: 18,
      logoUri: `${COINGECKO}/12591/thumb/binance-coin-logo.png?1696512401`,
    },
    {
      symbol: 'BTCB',
      name: 'Binance Bitcoin',
      address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      decimals: 18,
      logoUri: `${COINGECKO}/14108/thumb/Binance-bitcoin.png?1696513829`,
    },
    {
      symbol: 'ETH',
      name: 'Binance-Peg WETH',
      address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      decimals: 18,
      logoUri: `${COINGECKO}/39580/thumb/weth.png?1723006716`,
    },
    {
      symbol: 'DAI',
      name: 'Binance-Peg DAI',
      address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
      decimals: 18,
      logoUri: `${COINGECKO}/39784/thumb/dai.png?1724109857`,
    },
    {
      symbol: 'FDUSD',
      name: 'First Digital USD',
      address: '0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409',
      decimals: 18,
      logoUri: `${COINGECKO}/31079/thumb/FDUSD_icon_black.png?1731097953`,
    },
    {
      symbol: 'CAKE',
      name: 'PancakeSwap',
      address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
      decimals: 18,
      logoUri: `${COINGECKO}/12632/thumb/pancakeswap-cake-logo_%281%29.png?1696512440`,
    },
  ],
  // Base
  '8453': [
    {
      symbol: 'USDC',
      name: 'USDC',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      logoUri: `${COINGECKO}/6319/thumb/USDC.png?1769615602`,
    },
    {
      symbol: 'USDbC',
      name: 'Bridged USDC (Base)',
      address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
      decimals: 6,
      logoUri: `${COINGECKO}/31164/thumb/baseusdc.jpg?1696529993`,
    },
    {
      symbol: 'USDT',
      name: 'L2 Standard Bridged USDT (Base)',
      address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      decimals: 6,
      logoUri: `${COINGECKO}/39963/thumb/usdt.png?1724952731`,
    },
    {
      symbol: 'DAI',
      name: 'L2 Standard Bridged DAI (Base)',
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      decimals: 18,
      logoUri: `${COINGECKO}/39807/thumb/dai.png?1724126571`,
    },
    {
      symbol: 'WETH',
      name: 'L2 Standard Bridged WETH (Base)',
      address: '0x4200000000000000000000000000000000000006',
      decimals: 18,
      logoUri: `${COINGECKO}/39810/thumb/weth.png?1724139790`,
    },
    {
      symbol: 'cbBTC',
      name: 'Coinbase Wrapped BTC',
      address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
      decimals: 8,
      logoUri: `${COINGECKO}/40143/thumb/cbbtc.webp?1726136727`,
    },
    {
      symbol: 'EURC',
      name: 'EURC',
      address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
      decimals: 6,
      logoUri: `${COINGECKO}/26045/thumb/EURC.png?1769615705`,
    },
    {
      symbol: 'cbETH',
      name: 'Coinbase Wrapped Staked ETH',
      address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
      decimals: 18,
      logoUri: `${COINGECKO}/27008/thumb/cbeth.png?1709186989`,
    },
  ],
  // Polygon
  '137': [
    {
      symbol: 'USDC',
      name: 'USDC',
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      decimals: 6,
      logoUri: `${COINGECKO}/6319/thumb/USDC.png?1769615602`,
    },
    {
      symbol: 'USDC.e',
      name: 'Polygon Bridged USDC (Polygon PoS)',
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      decimals: 6,
      logoUri: `${SAFE_ASSETS}/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174.png`,
    },
    {
      symbol: 'USDT',
      name: 'USDT0',
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      decimals: 6,
      logoUri: `${COINGECKO}/53705/thumb/usdt0.jpg?1737086183`,
    },
    {
      symbol: 'DAI',
      name: 'Polygon PoS Bridged DAI (Polygon POS)',
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      decimals: 18,
      logoUri: `${COINGECKO}/39787/thumb/dai.png?1724110678`,
    },
    {
      symbol: 'WPOL',
      name: 'Wrapped POL',
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      decimals: 18,
      logoUri: `${SAFE_ASSETS}/0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270.png`,
    },
    {
      symbol: 'WETH',
      name: 'Polygon PoS Bridged WETH (Polygon POS)',
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      decimals: 18,
      logoUri: `${SAFE_ASSETS}/0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619.png`,
    },
    {
      symbol: 'WBTC',
      name: 'Polygon Bridged WBTC (Polygon POS)',
      address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
      decimals: 8,
      logoUri: `${COINGECKO}/39530/thumb/WBTCLOGO.png?1764570023`,
    },
  ],
  // Gnosis Chain
  '100': [
    {
      symbol: 'WXDAI',
      name: 'XDAI',
      address: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
      decimals: 18,
      logoUri: `${SAFE_ASSETS}/0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d.png`,
    },
    {
      symbol: 'USDC.e',
      name: 'Gnosis xDAI Bridged USDC (Gnosis)',
      address: '0x2a22f9c3b484c3629090FeED35F17Ff8F88f76F0',
      decimals: 6,
      logoUri: `${COINGECKO}/38775/thumb/USDC_Icon.webp?1718798033`,
    },
    {
      symbol: 'USDT',
      name: 'xDai Bridged USDT (Gnosis)',
      address: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6',
      decimals: 6,
      logoUri: `${COINGECKO}/35072/thumb/logo.png?1707292488`,
    },
    {
      symbol: 'GNO',
      name: 'Gnosis',
      address: '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb',
      decimals: 18,
      logoUri: `${COINGECKO}/662/thumb/logo_square_simple_300px.png?1696501854`,
    },
    {
      symbol: 'WETH',
      name: 'Gnosis xDai Bridged WETH (Gnosis Chain)',
      address: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1',
      decimals: 18,
      logoUri: `${COINGECKO}/39731/thumb/weth.png?1723759168`,
    },
    {
      symbol: 'sDAI',
      name: 'Savings xDAI',
      address: '0xaf204776c7245bF4147c2612BF6e5972Ee483701',
      decimals: 18,
      logoUri: `${COINGECKO}/32066/thumb/sDAI_Logo_%281%29.png?1696530863`,
    },
    {
      symbol: 'EURe',
      name: 'Monerium EUR emoney',
      address: '0x420CA0f9B9b604cE0fd9C18EF134C705e5Fa3430',
      decimals: 18,
      logoUri: `${COINGECKO}/54303/thumb/eure.jpg?1739167959`,
    },
    {
      symbol: 'SAFE',
      name: 'Safe',
      address: '0x4d18815D14fe5c3304e87B3FA18318baa5c23820',
      decimals: 18,
      logoUri: `${SAFE_ASSETS}/0x4d18815D14fe5c3304e87B3FA18318baa5c23820.png`,
    },
  ],
  // Avalanche
  '43114': [
    {
      symbol: 'USDC',
      name: 'USDC',
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      decimals: 6,
      logoUri: `${COINGECKO}/6319/thumb/USDC.png?1769615602`,
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
      decimals: 6,
      logoUri: `${COINGECKO}/325/thumb/Tether.png?1696501661`,
    },
    {
      symbol: 'USDC.e',
      name: 'Avalanche Bridged USDC (Avalanche)',
      address: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
      decimals: 6,
      logoUri: `${COINGECKO}/23263/thumb/3408.png?1696522483`,
    },
    {
      symbol: 'DAI.e',
      name: 'Avalanche Bridged DAI (Avalanche)',
      address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
      decimals: 18,
      logoUri: `${COINGECKO}/39786/thumb/dai.png?1724110324`,
    },
    {
      symbol: 'WAVAX',
      name: 'Wrapped AVAX',
      address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
      decimals: 18,
      logoUri: `${COINGECKO}/15075/thumb/wrapped-avax.png?1696514734`,
    },
    {
      symbol: 'WETH.e',
      name: 'Avalanche Bridged WETH (Avalanche)',
      address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
      decimals: 18,
      logoUri: `${COINGECKO}/39707/thumb/WETH.PNG?1723730205`,
    },
    {
      symbol: 'BTC.b',
      name: 'Lombard BTC.b',
      address: '0x152b9d0FdC40C096757F570A51E494bd4b943E50',
      decimals: 8,
      logoUri: `${COINGECKO}/26115/thumb/BTC.b.png?1772210755`,
    },
    {
      symbol: 'WBTC.e',
      name: 'Avalanche Bridged WBTC (Avalanche)',
      address: '0x50b7545627a5162F82A992c33b87aDc75187B218',
      decimals: 8,
      logoUri: `${COINGECKO}/39529/thumb/WBTCLOGO.png?1764684093`,
    },
  ],
  // Sepolia — the Transaction Service marks nothing as trusted here, including Circle's USDC
  '11155111': [
    {
      symbol: 'USDC',
      name: 'USDC',
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      decimals: 6,
      logoUri: `${SAFE_ASSETS}/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238.png`,
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      decimals: 18,
      logoUri: `${SAFE_ASSETS}/0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14.png`,
    },
    {
      symbol: 'LINK',
      name: 'ChainLink Token',
      address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
      decimals: 18,
      logoUri: `${SAFE_ASSETS}/0x779877A7B0D9E8603169DdbD7836e478b4624789.png`,
    },
    {
      symbol: 'EURC',
      name: 'EURC',
      address: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4',
      decimals: 6,
      logoUri: `${SAFE_ASSETS}/0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4.png`,
    },
    {
      symbol: 'DAI',
      name: 'DAI',
      address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
      decimals: 18,
      logoUri: `${SAFE_ASSETS}/0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357.png`,
    },
    {
      symbol: 'USDT',
      name: 'USDT',
      address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
      decimals: 6,
      logoUri: `${SAFE_ASSETS}/0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0.png`,
    },
    {
      symbol: 'UNI',
      name: 'Uniswap',
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      decimals: 18,
      logoUri: `${SAFE_ASSETS}/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984.png`,
    },
  ],
}

const NO_TOKENS: readonly PopularToken[] = []

export const getPopularTokens = (chainId: string): readonly PopularToken[] => POPULAR_TOKENS[chainId] ?? NO_TOKENS
