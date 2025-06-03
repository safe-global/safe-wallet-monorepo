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

export const hideEarnInfoStorageKey = 'hideEarnInfoV2'

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

// Vault APYs as of 03.06.2025
export const VaultAPYs: Record<string, Record<string, number>> = {
  '1': {
    '0xdAC17F958D2ee523a2206206994597C13D831ec7': 3.55,
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 3.89,
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 3.78,
    '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0': 0.68,
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 0.34,
  },
  '8453': {
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 5.6,
    '0x4200000000000000000000000000000000000006': 2.87,
  },
}

export const LowRangeAPY = 0.035
export const HighRangeAPY = 0.081
export const APYDisclaimer =
  '* based on historic averages of USD stablecoin and ETH Morpho vaults. Yields are variable and subject to change. Past performance is not a guarantee of future returns. The Kiln DeFi, Morpho Borrow and Vault products and features described herein are not offered or controlled by Core Contributors GmbH, Safe Ecosystem Foundation, and/or its affiliates.'
