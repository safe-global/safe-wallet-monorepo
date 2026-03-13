import { useState } from 'react'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import * as useBalancesModule from '@/hooks/useBalances'
import * as useChainIdModule from '@/hooks/useChainId'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { TokenType } from '@safe-global/store/gateway/types'
import { toBeHex } from 'ethers'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
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

const renderAssetsTable = (options: { balances?: Balances; loading?: boolean; showHiddenAssets?: boolean } = {}) => {
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
        balances: { fiatTotal: '0', items: [] },
      })
      expect(screen.getByText(/Add funds to get started/i)).toBeInTheDocument()
    })

    it('shows AddFundsCTA when only item has zero balance', () => {
      renderAssetsTable({
        balances: {
          fiatTotal: '0',
          items: [
            {
              balance: '0',
              fiatBalance: '0',
              fiatConversion: '0',
              tokenInfo: {
                address: toBeHex('0x1', 20),
                decimals: 18,
                logoUri: '',
                name: 'Ether',
                symbol: 'ETH',
                type: TokenType.NATIVE_TOKEN,
              },
            },
          ],
        },
      })
      expect(screen.getByText(/Add funds to get started/i)).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows skeleton rows while loading', () => {
      renderAssetsTable({
        balances: { fiatTotal: '0', items: [] },
        loading: true,
      })
      // Skeleton renders instead of table data; no token names visible
      expect(screen.queryByText('DAI')).not.toBeInTheDocument()
    })
  })

  describe('token rendering', () => {
    const twoTokenBalances: Balances = {
      fiatTotal: '150',
      items: [
        {
          balance: safeParseUnits('100', 18)!.toString(),
          fiatBalance: '100',
          fiatConversion: '1',
          tokenInfo: {
            address: toBeHex('0x1', 20),
            decimals: 18,
            logoUri: '',
            name: 'DAI',
            symbol: 'DAI',
            type: TokenType.ERC20,
          },
        },
        {
          balance: safeParseUnits('50', 6)!.toString(),
          fiatBalance: '50',
          fiatConversion: '1',
          tokenInfo: {
            address: toBeHex('0x2', 20),
            decimals: 6,
            logoUri: '',
            name: 'USD Coin',
            symbol: 'USDC',
            type: TokenType.ERC20,
          },
        },
      ],
    }

    it('renders token balances in the table', async () => {
      renderAssetsTable({ balances: twoTokenBalances })
      await waitFor(() => {
        expect(screen.getAllByText('100 DAI')[0]).toBeInTheDocument()
        expect(screen.getAllByText('50 USDC')[0]).toBeInTheDocument()
      })
    })

    it('renders both tokens when loaded', async () => {
      renderAssetsTable({ balances: twoTokenBalances })
      await waitFor(() => {
        expect(screen.getAllByTestId('token-balance')).toHaveLength(2)
      })
    })

    it('renders table header columns', () => {
      renderAssetsTable({ balances: twoTokenBalances })
      expect(screen.getByText('Asset')).toBeInTheDocument()
      expect(screen.getByText('Price')).toBeInTheDocument()
      expect(screen.getByText('Balance')).toBeInTheDocument()
      expect(screen.getByText('Value')).toBeInTheDocument()
    })
  })

  describe('hidden tokens mode', () => {
    const balanceWithTwoTokens: Balances = {
      fiatTotal: '200',
      items: [
        {
          balance: safeParseUnits('100', 18)!.toString(),
          fiatBalance: '100',
          fiatConversion: '1',
          tokenInfo: {
            address: toBeHex('0x10', 20),
            decimals: 18,
            logoUri: '',
            name: 'TokenA',
            symbol: 'TKA',
            type: TokenType.ERC20,
          },
        },
        {
          balance: safeParseUnits('100', 18)!.toString(),
          fiatBalance: '100',
          fiatConversion: '1',
          tokenInfo: {
            address: toBeHex('0x11', 20),
            decimals: 18,
            logoUri: '',
            name: 'TokenB',
            symbol: 'TKB',
            type: TokenType.ERC20,
          },
        },
      ],
    }

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
