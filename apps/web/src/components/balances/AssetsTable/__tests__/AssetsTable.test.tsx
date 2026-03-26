import { useState } from 'react'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import * as useBalancesModule from '@/hooks/useBalances'
import * as useChainIdModule from '@/hooks/useChainId'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { toBeHex } from 'ethers'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { balancesFixtures } from '@safe-global/test/msw/fixtures'
import { balancesBuilder, balanceBuilder, erc20TokenBuilder } from '@/tests/builders/balances'
import AssetsTable from '../index'

const DEFAULT_SETTINGS = {
  currency: 'usd',
  hiddenTokens: { '5': [] },
  tokenList: TOKEN_LISTS.ALL,
  shortName: { copy: true, qr: true },
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
  })

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
})
