/**
 * Popular tokens per chain for the spending-limit token selector (WA-3149, AC C14) — addresses only.
 *
 * Symbol, name, decimals and logo are resolved at runtime through CGW
 * (`GET /v1/chains/{chainId}/tokens?addresses=`), which reads the Transaction Service, the same source
 * the assets page uses. Freezing that metadata here would go stale on every token-list sync.
 *
 * Coverage: the six highest-traffic chains that expose SPENDING_LIMIT (Ethereum, BNB Chain, Base,
 * Polygon, Gnosis, Avalanche — 95% of spending-limit-eligible traffic in safe-client-gateway
 * production logs, 7 days to 2026-09-08) plus Sepolia. Other chains fall back to the Safe's own
 * tokens and the native currency, which is synthesised from `chain.nativeCurrency`.
 *
 * Every address was verified on 2026-09-08 with `GET <transactionService>/api/v1/tokens/<address>/`
 * on that chain's Transaction Service; re-verify the same way before editing. At most 20 per chain
 * (CGW batch cap). Keys are `ChainInfo.chainId` strings.
 */
export const POPULAR_TOKEN_ADDRESSES: Record<string, readonly string[]> = {
  // Ethereum: USDC, USDT, DAI, USDS, WETH, WBTC, cbBTC, SAFE
  '1': [
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    '0x5aFE3855358E112B5647B952709E6165e1c1eEEe',
  ],
  // BNB Chain: USDT, USDC, WBNB, BTCB, ETH, DAI, FDUSD, CAKE
  '56': [
    '0x55d398326f99059fF775485246999027B3197955',
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
    '0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409',
    '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  ],
  // Base: USDC, USDbC, USDT, DAI, WETH, cbBTC, EURC, cbETH
  '8453': [
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    '0x4200000000000000000000000000000000000006',
    '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
    '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
  ],
  // Polygon: USDC, USDC.e, USDT, DAI, WPOL, WETH, WBTC
  '137': [
    '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
  ],
  // Gnosis: WXDAI, USDC.e, USDT, GNO, WETH, sDAI, EURe, SAFE
  '100': [
    '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
    '0x2a22f9c3b484c3629090FeED35F17Ff8F88f76F0',
    '0x4ECaBa5870353805a9F068101A40E0f32ed605C6',
    '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb',
    '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1',
    '0xaf204776c7245bF4147c2612BF6e5972Ee483701',
    '0x420CA0f9B9b604cE0fd9C18EF134C705e5Fa3430',
    '0x4d18815D14fe5c3304e87B3FA18318baa5c23820',
  ],
  // Avalanche: USDC, USDT, USDC.e, DAI.e, WAVAX, WETH.e, BTC.b, WBTC.e
  '43114': [
    '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
    '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
    '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
    '0x152b9d0FdC40C096757F570A51E494bd4b943E50',
    '0x50b7545627a5162F82A992c33b87aDc75187B218',
  ],
  // Sepolia: USDC (Circle), WETH, LINK, EURC, DAI, USDT, UNI
  '11155111': [
    '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4',
    '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
    '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  ],
}

const NO_ADDRESSES: readonly string[] = []

export const getPopularTokenAddresses = (chainId: string): readonly string[] =>
  POPULAR_TOKEN_ADDRESSES[chainId] ?? NO_ADDRESSES
