import { faker } from '@faker-js/faker'
import { SupportedChainId } from '@cowprotocol/cow-sdk'
import { TradeType } from '@cowprotocol/widget-lib'
import darkPalette from '@safe-global/theme/palettes/dark'
import lightPalette from '@safe-global/theme/palettes/light'
import { SWAP_FEE_RECIPIENT } from '@/features/swap/constants'
import { getSwapWidgetParams, type SwapWidgetParamsInput } from '@/features/swap/helpers/widgetParams'

const buildInput = (overrides: Partial<SwapWidgetParamsInput> = {}): SwapWidgetParamsInput => ({
  chainId: SupportedChainId.GNOSIS_CHAIN,
  darkMode: false,
  flags: { feeEnabled: true, useStagingCowServer: false },
  tradeType: TradeType.SWAP,
  ...overrides,
})

describe('getSwapWidgetParams', () => {
  it.each([
    { feeEnabled: true, bps: 35 },
    { feeEnabled: false, bps: 0 },
  ])('charges $bps bps to the Safe fee recipient when the fee flag is $feeEnabled', ({ feeEnabled, bps }) => {
    const params = getSwapWidgetParams(buildInput({ flags: { feeEnabled, useStagingCowServer: false } }))

    expect(params.partnerFee).toEqual({ bps, recipient: SWAP_FEE_RECIPIENT })
  })

  it.each([
    { useStagingCowServer: true, baseUrl: 'https://staging.swap.cow.fi' },
    { useStagingCowServer: false, baseUrl: 'https://swap.cow.fi' },
  ])('loads CoW from $baseUrl when the staging flag is $useStagingCowServer', ({ useStagingCowServer, baseUrl }) => {
    const params = getSwapWidgetParams(buildInput({ flags: { feeEnabled: true, useStagingCowServer } }))

    expect(params.baseUrl).toBe(baseUrl)
  })

  it('embeds the widget for the given chain and trade type under the Safe app code', () => {
    const params = getSwapWidgetParams(
      buildInput({ chainId: SupportedChainId.ARBITRUM_ONE, tradeType: TradeType.LIMIT }),
    )

    expect(params).toMatchObject({
      appCode: 'Safe Wallet Swaps',
      chainId: SupportedChainId.ARBITRUM_ONE,
      tradeType: TradeType.LIMIT,
      standaloneMode: false,
      enabledTradeTypes: [TradeType.SWAP, TradeType.LIMIT, TradeType.ADVANCED],
    })
  })

  it('preselects the sell token from the route and leaves the buy token empty', () => {
    const sell = { asset: faker.finance.ethereumAddress(), amount: '1.5' }

    const params = getSwapWidgetParams(buildInput({ sell }))

    expect(params.sell).toEqual(sell)
    expect(params.buy).toEqual({ asset: '', amount: '0' })
  })

  it('leaves the sell token empty without one in the route', () => {
    const params = getSwapWidgetParams(buildInput({ sell: undefined }))

    expect(params.sell).toEqual({ asset: '', amount: '0' })
  })

  it.each([
    { darkMode: true, baseTheme: 'dark', palette: darkPalette },
    { darkMode: false, baseTheme: 'light', palette: lightPalette },
  ])('themes the widget $baseTheme from our palette', ({ darkMode, baseTheme, palette }) => {
    const params = getSwapWidgetParams(buildInput({ darkMode }))

    expect(params.theme).toMatchObject({ baseTheme, primary: palette.primary.main, paper: palette.background.paper })
  })
})
