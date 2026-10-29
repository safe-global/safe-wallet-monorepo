import { useState } from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fakerChecksummedAddress, render } from '@/tests/test-utils'
import * as useBalancesModule from '@/hooks/useBalances'
import * as useChainIdModule from '@/hooks/useChainId'
import * as useChains from '@/hooks/useChains'
import * as useSafeAddressModule from '@/hooks/useSafeAddress'
import { chainBuilder } from '@/tests/builders/chains'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { toBeHex } from 'ethers'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { balancesFixtures } from '@safe-global/test/msw/fixtures'
import { balancesBuilder, balanceBuilder, erc20TokenBuilder, nativeTokenBuilder } from '@/tests/builders/balances'
import { SAFE_TOKEN_ADDRESSES } from '@/config/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { mockHasFeature } from '@/tests/mocks/hooks'
import AssetsTable from '../index'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useChain: jest.fn(),
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(),
}))

// jsdom has no canvas, so the QR code shows the value it encodes as an attribute
jest.mock('qrcode.react', () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => <canvas role="img" aria-label="QR code" data-value={value} />,
}))

const mockUseIsMobile = jest.fn(() => false)
jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: () => mockUseIsMobile() }))

const mockUseSafeTokenEnabled = jest.fn(() => false)
jest.mock('@/hooks/useSafeTokenEnabled', () => ({ useSafeTokenEnabled: () => mockUseSafeTokenEnabled() }))

jest.mock('@/hooks/useOpenSafenetStakingApp', () => ({
  useOpenSafenetStakingApp: () => ({ openSafenetStakingApp: jest.fn(), isNavigating: false }),
}))

const DEFAULT_SETTINGS = {
  currency: 'usd',
  hiddenTokens: { '5': [] },
  tokenList: TOKEN_LISTS.ALL,
  shortName: { qr: true },
  theme: { darkMode: false },
  env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
  signing: { onChainSigning: false, blindSigning: false },
  transactionExecution: true,
  curatedNestedSafes: {},
}

const TestWrapper = ({ showHiddenAssets = false }: { showHiddenAssets?: boolean }) => {
  const [showHidden, setShowHidden] = useState(showHiddenAssets)
  return <AssetsTable showHiddenAssets={showHidden} setShowHiddenAssets={setShowHidden} />
}

const renderAssetsTable = (
  options: {
    balances?: Balances
    loading?: boolean
    showHiddenAssets?: boolean
  } = {},
) => {
  const { balances, loading = false, showHiddenAssets = false } = options

  if (balances !== undefined) {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue({
      balances,
      loading,
      loaded: !loading,
      error: undefined,
    })
  }

  return render(<TestWrapper showHiddenAssets={showHiddenAssets} />, {
    initialReduxState: { settings: DEFAULT_SETTINGS } as never,
  })
}

describe('AssetsTable', () => {
  beforeEach(() => {
    window.localStorage.clear()
    jest.clearAllMocks()
    jest.spyOn(useChainIdModule, 'default').mockReturnValue('5')
    mockUseIsMobile.mockReturnValue(false)
    mockUseSafeTokenEnabled.mockReturnValue(false)
    mockHasFeature(false)
    jest.mocked(useChains.useCurrentChain).mockReturnValue(undefined)
  })

  afterEach(() => jest.restoreAllMocks())

  describe('empty state', () => {
    it('shows AddFundsCTA when balances list is empty', () => {
      renderAssetsTable({
        balances: balancesFixtures.empty,
      })
      expect(screen.getByText(/Add funds to get started/i)).toBeInTheDocument()
    })

    it('shows AddFundsCTA when only item has zero balance', () => {
      const zeroBalance = balancesBuilder()
        .with({
          fiatTotal: '0',
          items: [
            balanceBuilder()
              .with({
                balance: '0',
                fiatBalance: '0',
                fiatConversion: '0',
                tokenInfo: erc20TokenBuilder()
                  .with({ name: 'Ether', symbol: 'ETH', type: 'NATIVE_TOKEN' as never })
                  .build(),
              })
              .build(),
          ],
        })
        .build()

      renderAssetsTable({ balances: zeroBalance })
      expect(screen.getByText(/Add funds to get started/i)).toBeInTheDocument()
    })

    it('shows the Safe address in a QR code and drops the chain prefix when the switch is turned off', async () => {
      const safeAddress = fakerChecksummedAddress()
      jest.spyOn(useSafeAddressModule, 'default').mockReturnValue(safeAddress)
      jest.mocked(useChains.useCurrentChain).mockReturnValue(chainBuilder().with({ shortName: 'gor' }).build())

      renderAssetsTable({ balances: balancesFixtures.empty })

      const addFunds = screen.getByTestId('add-funds-section')
      const qrCode = within(addFunds).getByRole('img', { name: 'QR code' })
      expect(qrCode).toHaveAttribute('data-value', `gor:${safeAddress}`)
      expect(addFunds).toHaveTextContent(safeAddress)

      await userEvent.click(within(addFunds).getByRole('switch', { name: 'QR code with chain prefix' }))

      expect(qrCode).toHaveAttribute('data-value', safeAddress)
    })
  })

  describe('loading state', () => {
    it('shows skeleton rows while loading', () => {
      renderAssetsTable({
        balances: balancesFixtures.empty,
        loading: true,
      })
      // Skeleton renders instead of table data; no token names visible
      expect(screen.queryByText('DAI')).not.toBeInTheDocument()
    })
  })

  describe('token rendering', () => {
    it('renders token balances from fixture data', async () => {
      renderAssetsTable({ balances: balancesFixtures.efSafe })
      await waitFor(() => {
        // efSafe fixture contains real token data - verify at least one token renders
        expect(screen.getAllByTestId('token-balance').length).toBeGreaterThan(0)
      })
    })

    it('renders table header columns', () => {
      renderAssetsTable({ balances: balancesFixtures.efSafe })
      expect(screen.getByText('Asset')).toBeInTheDocument()
      expect(screen.getByText('Price')).toBeInTheDocument()
      expect(screen.getByText('Balance')).toBeInTheDocument()
      expect(screen.getByText('Value')).toBeInTheDocument()
    })

    it('shows the price and value with two decimals in the list', async () => {
      const item = balanceBuilder().with({ fiatConversion: '2345.67', fiatBalance: '9876.54' }).build()
      renderAssetsTable({
        balances: balancesBuilder()
          .with({ items: [item] })
          .build(),
      })

      await waitFor(() => {
        expect(screen.getByText('$ 2,345')).toBeInTheDocument()
        expect(screen.getByText('.67')).toBeInTheDocument()
        expect(screen.getAllByText('$ 9,876')[0]).toBeInTheDocument()
        expect(screen.getAllByText('.54')[0]).toBeInTheDocument()
      })
    })

    it('links each ERC-20 token name to the block explorer and leaves the native token unlinked', async () => {
      jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(
        chainBuilder()
          .with({
            features: [],
            blockExplorerUriTemplate: {
              address: 'https://explorer.test/address/{{address}}',
              txHash: 'https://explorer.test/tx/{{txHash}}',
              api: 'https://explorer.test/api',
            },
          })
          .build(),
      )
      const native = nativeTokenBuilder().build()
      const erc20 = erc20TokenBuilder().build()
      renderAssetsTable({
        balances: balancesBuilder()
          .with({
            items: [
              balanceBuilder().with({ tokenInfo: native }).build(),
              balanceBuilder().with({ tokenInfo: erc20 }).build(),
            ],
          })
          .build(),
      })

      expect(await screen.findByRole('link', { name: erc20.name })).toHaveAttribute(
        'href',
        `https://explorer.test/address/${erc20.address}`,
      )
      expect(screen.queryByRole('link', { name: native.name })).not.toBeInTheDocument()
      expect(screen.getByText(native.name)).toBeInTheDocument()
    })

    it('shows token values in the selected currency', async () => {
      jest.spyOn(useBalancesModule, 'default').mockReturnValue({
        balances: balancesBuilder()
          .with({ items: [balanceBuilder().with({ fiatBalance: '100' }).build()] })
          .build(),
        loading: false,
        loaded: true,
        error: undefined,
      })

      render(<TestWrapper />, { initialReduxState: { settings: { ...DEFAULT_SETTINGS, currency: 'eur' } } as never })

      const value = await screen.findByTestId('table-cell-value')
      expect(value).toHaveTextContent('€')
      expect(value).not.toHaveTextContent('$')
    })

    it('shows -- as the value of a token without a price', async () => {
      jest.spyOn(useBalancesModule, 'default').mockReturnValue({
        balances: balancesBuilder()
          .with({
            items: [
              balanceBuilder()
                .with({
                  balance: safeParseUnits('5', 18)!.toString(),
                  fiatConversion: '0',
                  fiatBalance: '0',
                  tokenInfo: erc20TokenBuilder().with({ decimals: 18 }).build(),
                })
                .build(),
            ],
          })
          .build(),
        loading: false,
        loaded: true,
        error: undefined,
      })

      render(<TestWrapper />, { initialReduxState: { settings: { ...DEFAULT_SETTINGS, hideDust: false } } as never })

      expect(await screen.findByTestId('table-cell-value')).toHaveTextContent('--')
    })

    it('sorts tokens by balance amount across different decimals', async () => {
      const fiveOfSixDecimals = balanceBuilder()
        .with({
          balance: '5000000',
          tokenInfo: erc20TokenBuilder()
            .with({ address: toBeHex('0x20', 20), name: 'TokenA', decimals: 6 })
            .build(),
        })
        .build()
      const twoOfEighteenDecimals = balanceBuilder()
        .with({
          balance: '2000000000000000000',
          tokenInfo: erc20TokenBuilder()
            .with({ address: toBeHex('0x21', 20), name: 'TokenB', decimals: 18 })
            .build(),
        })
        .build()
      renderAssetsTable({
        balances: balancesBuilder()
          .with({ items: [fiveOfSixDecimals, twoOfEighteenDecimals] })
          .build(),
      })
      const shownNames = () => screen.getAllByTestId('token-name').map((name) => name.textContent)
      await screen.findAllByTestId('token-name')

      fireEvent.click(screen.getByRole('button', { name: /^Balance/ }))
      expect(shownNames()).toEqual(['TokenB', 'TokenA'])

      fireEvent.click(screen.getByRole('button', { name: /^Balance/ }))
      expect(shownNames()).toEqual(['TokenA', 'TokenB'])
    })
  })

  describe('breakpoint gap regression (WA-3437)', () => {
    // The built branch must match the one CSS shows: styles.module.css swaps at 767.98px, so the
    // gate has to be useIsMobile() (768px), not useIsBelowSm() (600px).
    it('builds the mobile list when useIsMobile is true', async () => {
      mockUseIsMobile.mockReturnValue(true)

      const { container } = renderAssetsTable({ balances: balancesFixtures.efSafe })

      await waitFor(() => {
        expect(screen.queryAllByTestId('token-balance')).toHaveLength(0)
        expect(container.querySelector('.mobileContainer')).toBeInTheDocument()
      })
    })

    it('builds the desktop table when useIsMobile is false', async () => {
      mockUseIsMobile.mockReturnValue(false)

      const { container } = renderAssetsTable({ balances: balancesFixtures.efSafe })

      await waitFor(() => {
        expect(screen.getAllByTestId('token-balance').length).toBeGreaterThan(0)
        expect(container.querySelector('.mobileContainer')).not.toBeInTheDocument()
      })
    })
  })

  describe('hidden tokens mode', () => {
    const tokenA = erc20TokenBuilder()
      .with({ address: toBeHex('0x10', 20), name: 'TokenA', symbol: 'TKA', decimals: 18 })
      .build()
    const tokenB = erc20TokenBuilder()
      .with({ address: toBeHex('0x11', 20), name: 'TokenB', symbol: 'TKB', decimals: 18 })
      .build()

    const balanceWithTwoTokens = balancesBuilder()
      .with({
        fiatTotal: '200',
        items: [
          balanceBuilder()
            .with({
              balance: safeParseUnits('100', 18)!.toString(),
              fiatBalance: '100',
              fiatConversion: '1',
              tokenInfo: tokenA,
            })
            .build(),
          balanceBuilder()
            .with({
              balance: safeParseUnits('100', 18)!.toString(),
              fiatBalance: '100',
              fiatConversion: '1',
              tokenInfo: tokenB,
            })
            .build(),
        ],
      })
      .build()

    it('shows all tokens in showHiddenAssets mode', async () => {
      jest.spyOn(useBalancesModule, 'default').mockReturnValue({
        balances: balanceWithTwoTokens,
        loading: false,
        loaded: true,
        error: undefined,
      })

      render(<AssetsTable showHiddenAssets={true} setShowHiddenAssets={jest.fn()} />, {
        initialReduxState: {
          settings: {
            ...DEFAULT_SETTINGS,
            hiddenTokens: { '5': [toBeHex('0x11', 20)] },
          },
        } as never,
      })

      await waitFor(() => {
        expect(screen.getAllByText('100 TKA')[0]).toBeInTheDocument()
        expect(screen.getAllByText('100 TKB')[0]).toBeInTheDocument()
      })
    })

    it('hides tokens that are in the hidden list in normal mode', async () => {
      jest.spyOn(useBalancesModule, 'default').mockReturnValue({
        balances: balanceWithTwoTokens,
        loading: false,
        loaded: true,
        error: undefined,
      })

      render(<AssetsTable showHiddenAssets={false} setShowHiddenAssets={jest.fn()} />, {
        initialReduxState: {
          settings: {
            ...DEFAULT_SETTINGS,
            hiddenTokens: { '5': [toBeHex('0x11', 20)] },
          },
        } as never,
      })

      await waitFor(() => {
        expect(screen.getAllByText('100 TKA')[0]).toBeInTheDocument()
        expect(screen.queryByText('100 TKB')).not.toBeInTheDocument()
      })
    })
  })

  describe('staking entry point (WA-3450)', () => {
    const MAINNET = '1'

    const nativeAndSafeBalances = () =>
      balancesBuilder()
        .with({
          items: [
            balanceBuilder()
              .with({ balance: safeParseUnits('1', 18)!.toString(), tokenInfo: nativeTokenBuilder().build() })
              .build(),
            balanceBuilder()
              .with({
                balance: safeParseUnits('100', 18)!.toString(),
                tokenInfo: erc20TokenBuilder()
                  .with({ address: SAFE_TOKEN_ADDRESSES[MAINNET], decimals: 18, name: 'Safe Token', symbol: 'SAFE' })
                  .build(),
              })
              .build(),
          ],
        })
        .build()

    beforeEach(() => {
      jest.spyOn(useChainIdModule, 'default').mockReturnValue(MAINNET)
    })

    it('shows the Safenet staking icon on the SAFE row and none on the native row', async () => {
      mockUseSafeTokenEnabled.mockReturnValue(true)
      renderAssetsTable({ balances: nativeAndSafeBalances() })

      await waitFor(() => {
        expect(screen.getAllByTestId('safenet-stake-btn')).toHaveLength(1)
      })
      expect(screen.queryByTestId('stake-btn')).not.toBeInTheDocument()
    })

    it('shows no staking icon at all when Safenet staking is unavailable', async () => {
      mockUseSafeTokenEnabled.mockReturnValue(false)
      renderAssetsTable({ balances: nativeAndSafeBalances() })

      await waitFor(() => {
        expect(screen.getAllByText('Safe Token').length).toBeGreaterThan(0)
      })
      expect(screen.queryByTestId('safenet-stake-btn')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stake-btn')).not.toBeInTheDocument()
    })
  })

  describe('swap entry point', () => {
    const tokens = [nativeTokenBuilder().build(), erc20TokenBuilder().build(), erc20TokenBuilder().build()]

    const nonZeroBalances = () =>
      balancesBuilder()
        .with({ items: tokens.map((tokenInfo) => balanceBuilder().with({ tokenInfo }).build()) })
        .build()

    const rowOf = (tokenName: string) =>
      screen.getAllByRole('row').find((row) => within(row).queryAllByText(tokenName).length > 0)

    it('shows a Swap button in the Actions cell of every asset row when swaps are available', async () => {
      mockHasFeature({ [FEATURES.NATIVE_SWAPS]: true })
      renderAssetsTable({ balances: nonZeroBalances() })

      await screen.findAllByTestId('swap-btn')
      for (const { name } of tokens) {
        const actionsCell = within(rowOf(name)!).getByTestId('table-cell-actions')
        expect(within(actionsCell).getByTestId('swap-btn')).toBeInTheDocument()
      }
    })

    it('shows no Swap button when swaps are unavailable on the chain', async () => {
      mockHasFeature(false)
      renderAssetsTable({ balances: nonZeroBalances() })

      for (const { name } of tokens) {
        expect((await screen.findAllByText(name)).length).toBeGreaterThan(0)
      }
      expect(screen.queryByTestId('swap-btn')).not.toBeInTheDocument()
    })
  })
})
