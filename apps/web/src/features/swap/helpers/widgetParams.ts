import { TradeType, type CowSwapWidgetParams } from '@cowprotocol/widget-lib'
import lightPalette from '@safe-global/theme/palettes/light'
import darkPalette from '@safe-global/theme/palettes/dark'
import { BRAND_NAME } from '@/config/constants'
import { SWAP_FEE_RECIPIENT } from '../constants'

const BASE_URL = typeof window !== 'undefined' && window.location.origin ? window.location.origin : ''
const SWAP_FEE_BPS = 35

export type SwapWidgetFlags = {
  feeEnabled?: boolean
  useStagingCowServer?: boolean
}

export type SwapWidgetParamsInput = {
  chainId: CowSwapWidgetParams['chainId']
  darkMode: boolean
  flags: SwapWidgetFlags
  tradeType: CowSwapWidgetParams['tradeType']
  sell?: { asset: string; amount: string }
}

export const getCowSwapBaseUrl = (useStagingCowServer?: boolean): string =>
  useStagingCowServer ? 'https://staging.swap.cow.fi' : 'https://swap.cow.fi'

export const getSwapWidgetTheme = (darkMode: boolean): CowSwapWidgetParams['theme'] => {
  const palette = darkMode ? darkPalette : lightPalette

  return {
    baseTheme: darkMode ? 'dark' : 'light',
    primary: palette.primary.main,
    background: palette.background.main,
    paper: palette.background.paper,
    text: palette.text.primary,
    danger: palette.error.dark,
    info: palette.info.main,
    success: palette.success.main,
    warning: palette.warning.main,
    alert: palette.warning.main,
  }
}

export const getSwapWidgetParams = ({
  chainId,
  darkMode,
  flags,
  tradeType,
  sell,
}: SwapWidgetParamsInput): CowSwapWidgetParams => ({
  appCode: 'Safe Wallet Swaps', // Name of your app (max 50 characters)
  // Must match appData.url (used as the communicator's allowed origin) or the Safe Apps SDK
  // handshake is dropped and the widget can't auto-connect the Safe
  baseUrl: getCowSwapBaseUrl(flags.useStagingCowServer),
  width: '100%', // Width in pixels (or 100% to use all available space)
  height: '860px',
  chainId,
  standaloneMode: false,
  disableToastMessages: true,
  disablePostedOrderConfirmationModal: true,
  disableCrossChainSwap: true,
  hideLogo: true,
  hideNetworkSelector: true,
  sounds: {
    orderError: null,
    orderExecuted: null,
    postOrder: null,
  },
  tradeType,
  sell: sell || {
    asset: '',
    amount: '0',
  },
  buy: {
    asset: '',
    amount: '0',
  },
  images: {
    emptyOrders: darkMode
      ? BASE_URL + '/images/common/swap-empty-dark.svg'
      : BASE_URL + '/images/common/swap-empty-light.svg',
  },
  enabledTradeTypes: [TradeType.SWAP, TradeType.LIMIT, TradeType.ADVANCED],
  theme: getSwapWidgetTheme(darkMode),
  partnerFee: {
    bps: flags.feeEnabled ? SWAP_FEE_BPS : 0,
    recipient: SWAP_FEE_RECIPIENT,
  },
  content: {
    feeLabel: 'Widget Fee',
    feeTooltipMarkdown: `The [tiered widget fee](https://help.safe.global/articles/9969629388-How-does-the-widget-fee-work-for-native-swaps) incurred here is charged by CoW Protocol for the operation of this widget. The fee is automatically calculated into this quote. Part of the fee will contribute to a license fee that supports the Safe Community. Neither the Safe Ecosystem Foundation nor ${BRAND_NAME} operate the CoW Swap Widget and/or CoW Swap`,
  },
})
