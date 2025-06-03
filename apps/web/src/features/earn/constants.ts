export const EARN_TITLE = 'Earn'
export const WIDGET_TESTNET_URL = 'https://safe.widget.testnet.kiln.fi/earn'
export const WIDGET_PRODUCTION_URL = 'https://safe-defi.widget.kiln.fi/earn'
export const EARN_CONSENT_STORAGE_KEY = 'lendDisclaimerAcceptedV1'
export const EARN_HELP_ARTICLE = 'https://help.safe.global/en/articles/322149-defi-lending-in-safe-wallet'

export const widgetAppData = {
  url: WIDGET_TESTNET_URL,
  name: EARN_TITLE,
  chainIds: ['1', '8453'],
}

export const EligibleEarnTokens: Record<string, string[]> = {
  '1': [
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0', // wstETH
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
  ],
  '8453': [
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    '0x4200000000000000000000000000000000000006', // WETH
  ],
}
