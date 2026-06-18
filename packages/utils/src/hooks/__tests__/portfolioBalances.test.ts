import {
  createPortfolioBalances,
  transformPortfolioToBalances,
  calculateTokensFiatTotal,
  excludeTokensFromBalances,
  initialBalancesState,
  type PortfolioBalances,
} from '@safe-global/utils/hooks/portfolioBalances'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Portfolio } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'

describe('portfolioBalances helpers', () => {
  describe('initialBalancesState', () => {
    it('should have empty items and fiatTotal', () => {
      expect(initialBalancesState.items).toEqual([])
      expect(initialBalancesState.fiatTotal).toBe('')
    })
  })

  describe('createPortfolioBalances', () => {
    it('should wrap tx service balances with portfolio fields', () => {
      const balances: Balances = {
        fiatTotal: '1000',
        items: [
          {
            balance: '1',
            fiatBalance: '1000',
            fiatConversion: '1000',
            tokenInfo: {
              address: '0x1',
              decimals: 18,
              logoUri: '',
              name: 'Token',
              symbol: 'TKN',
              type: 'ERC20',
            },
          },
        ],
      }

      const result = createPortfolioBalances(balances)

      expect(result.fiatTotal).toBe('1000')
      expect(result.tokensFiatTotal).toBe('1000')
      expect(result.positionsFiatTotal).toBe('0')
      expect(result.positions).toBeUndefined()
      expect(result.items).toEqual(balances.items)
    })
  })

  describe('transformPortfolioToBalances', () => {
    it('should return undefined for undefined portfolio', () => {
      expect(transformPortfolioToBalances(undefined)).toBeUndefined()
    })

    const portfolio: Portfolio = {
      totalBalanceFiat: '3000',
      totalTokenBalanceFiat: '2000',
      totalPositionsBalanceFiat: '1000',
      tokenBalances: [
        {
          tokenInfo: {
            address: '0x1',
            decimals: 18,
            logoUri: 'https://example.com/logo.png',
            name: 'Token',
            symbol: 'TKN',
            type: 'ERC20' as const,
            chainId: '1',
            trusted: true,
          },
          balance: '1000',
          balanceFiat: '2000',
          price: '2',
          priceChangePercentage1d: '0.05',
        },
      ],
      positionBalances: [],
    }

    it('should transform fiat totals correctly', () => {
      const result = transformPortfolioToBalances(portfolio)

      expect(result?.fiatTotal).toBe('3000')
      expect(result?.tokensFiatTotal).toBe('2000')
      expect(result?.positionsFiatTotal).toBe('1000')
    })

    it('should transform token items correctly', () => {
      const result = transformPortfolioToBalances(portfolio)

      expect(result?.items).toHaveLength(1)
      expect(result?.items[0]?.fiatBalance).toBe('2000')
      expect(result?.items[0]?.fiatConversion).toBe('2')
    })

    it('should transform positions correctly', () => {
      const result = transformPortfolioToBalances(portfolio)

      expect(result?.positions).toEqual([])
    })

    it('should handle price change data', () => {
      const result = transformPortfolioToBalances(portfolio)

      expect(result?.items[0]?.fiatBalance24hChange).toBe('0.05')
    })

    it('should default logoUri to empty string when missing', () => {
      const portfolio: Portfolio = {
        totalBalanceFiat: '0',
        totalTokenBalanceFiat: '0',
        totalPositionsBalanceFiat: '0',
        tokenBalances: [
          {
            tokenInfo: {
              address: '0x1',
              decimals: 18,
              logoUri: '',
              name: 'Token',
              symbol: 'TKN',
              type: 'ERC20' as const,
              chainId: '1',
              trusted: true,
            },
            balance: '0',
            balanceFiat: '0',
            price: '0',
            priceChangePercentage1d: '0',
          },
        ],
        positionBalances: [],
      }

      const result = transformPortfolioToBalances(portfolio)

      expect(result?.items[0]?.tokenInfo.logoUri).toBe('')
    })
  })

  describe('calculateTokensFiatTotal', () => {
    it('should sum fiat balances from items', () => {
      const items: Balances['items'] = [
        {
          balance: '1',
          fiatBalance: '100',
          fiatConversion: '100',
          tokenInfo: { address: '0x1', decimals: 18, logoUri: '', name: 'A', symbol: 'A', type: 'ERC20' },
        },
        {
          balance: '1',
          fiatBalance: '200.5',
          fiatConversion: '200.5',
          tokenInfo: { address: '0x2', decimals: 18, logoUri: '', name: 'B', symbol: 'B', type: 'ERC20' },
        },
      ]

      expect(calculateTokensFiatTotal(items)).toBe('300.5')
    })

    it('should return 0 for empty items', () => {
      expect(calculateTokensFiatTotal([])).toBe('0')
    })

    it('should handle missing fiatBalance', () => {
      const items: Balances['items'] = [
        {
          balance: '1',
          fiatBalance: '',
          fiatConversion: '0',
          tokenInfo: { address: '0x1', decimals: 18, logoUri: '', name: 'A', symbol: 'A', type: 'ERC20' },
        },
      ]

      expect(calculateTokensFiatTotal(items)).toBe('0')
    })
  })

  describe('excludeTokensFromBalances', () => {
    const makeBalances = (): PortfolioBalances => ({
      fiatTotal: '300',
      tokensFiatTotal: '300',
      positionsFiatTotal: '0',
      items: [
        {
          balance: '1',
          fiatBalance: '100',
          fiatConversion: '100',
          tokenInfo: { address: '0xAAA', decimals: 18, logoUri: '', name: 'A', symbol: 'A', type: 'ERC20' },
        },
        {
          balance: '1',
          fiatBalance: '200',
          fiatConversion: '200',
          tokenInfo: { address: '0xBBB', decimals: 18, logoUri: '', name: 'B', symbol: 'B', type: 'ERC20' },
        },
      ],
    })

    it('should remove matching tokens and adjust fiat totals', () => {
      const result = excludeTokensFromBalances(makeBalances(), ['0xbbb'])

      expect(result.items).toHaveLength(1)
      expect(result.items[0]?.tokenInfo.address).toBe('0xAAA')
      expect(result.fiatTotal).toBe('100')
      expect(result.tokensFiatTotal).toBe('100')
    })

    it('should match addresses case-insensitively', () => {
      const result = excludeTokensFromBalances(makeBalances(), ['0XbBb'])

      expect(result.items.map((item) => item.tokenInfo.address)).toEqual(['0xAAA'])
    })

    it('should return the same reference when nothing matches', () => {
      const balances = makeBalances()
      const result = excludeTokensFromBalances(balances, ['0xdoesnotexist'])

      expect(result).toBe(balances)
    })

    it('should leave empty fiat totals untouched', () => {
      const balances: PortfolioBalances = { ...makeBalances(), fiatTotal: '', tokensFiatTotal: undefined }
      const result = excludeTokensFromBalances(balances, ['0xbbb'])

      expect(result.fiatTotal).toBe('')
      expect(result.tokensFiatTotal).toBeUndefined()
    })

    it('should handle removed tokens with missing fiatBalance', () => {
      const balances = makeBalances()
      balances.items[1]!.fiatBalance = ''
      const result = excludeTokensFromBalances(balances, ['0xbbb'])

      expect(result.fiatTotal).toBe('300')
    })
  })
})
