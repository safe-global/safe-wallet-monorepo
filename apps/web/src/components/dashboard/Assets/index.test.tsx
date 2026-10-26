import { FEATURES } from '@safe-global/utils/utils/chains'
import * as useBalancesModule from '@/hooks/useBalances'
import * as useChainIdModule from '@/hooks/useChainId'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { balanceBuilder, balancesBuilder, erc20TokenBuilder, nativeTokenBuilder } from '@/tests/builders/balances'
import { mockHasFeature } from '@/tests/mocks/hooks'
import { render, screen } from '@/tests/test-utils'
import AssetsWidget from '.'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useChain: jest.fn(),
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(),
}))

const CHAIN_ID = '5'

const SETTINGS = {
  currency: 'usd',
  hiddenTokens: { [CHAIN_ID]: [] },
  tokenList: TOKEN_LISTS.ALL,
  shortName: { qr: true },
  theme: { darkMode: false },
  env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
  signing: { onChainSigning: false, blindSigning: false },
  transactionExecution: true,
  curatedNestedSafes: {},
}

const tokens = [nativeTokenBuilder().build(), erc20TokenBuilder().build(), erc20TokenBuilder().build()]

const renderAssetsWidget = () => {
  const balances = balancesBuilder()
    .with({ items: tokens.map((tokenInfo) => balanceBuilder().with({ tokenInfo }).build()) })
    .build()
  jest.spyOn(useBalancesModule, 'default').mockReturnValue({ balances, loading: false, loaded: true, error: undefined })

  return render(<AssetsWidget />, { initialReduxState: { settings: SETTINGS } as never })
}

describe('Dashboard assets widget', () => {
  beforeEach(() => {
    jest.spyOn(useChainIdModule, 'default').mockReturnValue(CHAIN_ID)
  })

  it('shows a Swap button next to every top asset when swaps are available', async () => {
    mockHasFeature({ [FEATURES.NATIVE_SWAPS]: true })

    renderAssetsWidget()

    expect(await screen.findAllByTestId('swap-btn')).toHaveLength(tokens.length)
  })

  it('shows no Swap button next to the top assets when swaps are unavailable', async () => {
    mockHasFeature(false)

    renderAssetsWidget()

    for (const { name } of tokens) {
      expect((await screen.findAllByText(name)).length).toBeGreaterThan(0)
    }
    expect(screen.queryByTestId('swap-btn')).not.toBeInTheDocument()
  })
})
