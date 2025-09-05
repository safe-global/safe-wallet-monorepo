import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { type SafeBalanceResponse, type TokenInfo, TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { useTokenAmount, useVisibleTokens } from '@/components/tx-flow/flows/TokenTransfer/utils'
import { renderHook } from '@/tests/test-utils'
import * as spendingLimit from '@/hooks/useSpendingLimit'
import * as spendingLimitBeneficiary from '@/hooks/useIsOnlySpendingLimitBeneficiary'
import * as visibleBalances from '@/hooks/useVisibleBalances'
import * as wallet from '@/hooks/wallets/useWallet'

describe('TokenTransfer utils', () => {
  describe('useTokenAmount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return a totalAmount of 0 if there is no token', () => {
      const { result } = renderHook(() => useTokenAmount(undefined))

      expect(result.current.totalAmount).toStrictEqual(BigInt(0))
    })

    it('should return the totalAmount if there is a token', () => {
      const mockToken = {
        tokenInfo: { address: '0x2', symbol: 'TST', decimals: 16 } as TokenInfo,
        balance: '100',
        fiatBalance: '100',
        fiatConversion: '1',
      }
      const { result } = renderHook(() => useTokenAmount(mockToken))

      expect(result.current.totalAmount).toStrictEqual(BigInt(mockToken.balance))
    })

    it('should return a spendingLimitAmount of 0 if there is no spending limit token', () => {
      jest.spyOn(spendingLimit, 'default').mockReturnValue(undefined)

      const { result } = renderHook(() => useTokenAmount(undefined))

      expect(result.current.spendingLimitAmount).toStrictEqual(BigInt(0))
    })

    it('should return the remaining spending limit amount for a token', () => {
      const mockSpendingLimitToken = {
        beneficiary: '0x1',
        token: { address: '0x2', symbol: 'TST', decimals: 16 },
        amount: '100',
        nonce: '',
        resetTimeMin: '',
        lastResetMin: '',
        spent: '30',
      }

      jest.spyOn(spendingLimit, 'default').mockReturnValue(mockSpendingLimitToken)

      const { result } = renderHook(() => useTokenAmount(undefined))

      expect(result.current.spendingLimitAmount).toStrictEqual(BigInt('70'))
    })
  })

  describe('useVisibleTokens', () => {
    it('returns balance items if its not a spending limit beneficiary', () => {
      const mockToken = {
        balance: '100',
        fiatBalance: '100',
        fiatConversion: '1',
        tokenInfo: {
          address: '0x1',
          decimals: 18,
          logoUri: '',
          name: 'Test Token',
          symbol: 'TST',
          type: TokenType.ERC20,
        },
      }

      const mockToken1 = {
        balance: '60',
        fiatBalance: '60',
        fiatConversion: '1',
        tokenInfo: {
          address: '0x2',
          decimals: 18,
          logoUri: '',
          name: 'Test Token 1',
          symbol: 'TST1',
          type: TokenType.ERC20,
        },
      }
      const balance: SafeBalanceResponse = {
        fiatTotal: '200',
        items: [mockToken, mockToken1],
      }

      jest.spyOn(spendingLimitBeneficiary, 'default').mockReturnValue(false)
      jest.spyOn(visibleBalances, 'useVisibleBalances').mockReturnValue({
        balances: balance,
        loading: false,
        loaded: true,
      })

      const { result } = renderHook(() => useVisibleTokens())

      expect(result.current).toStrictEqual(balance.items)
    })

    it('only returns spending limit tokens if its a spending limit beneficiary', () => {
      const mockSpendingLimitToken = {
        beneficiary: '0x3',
        token: { address: '0x1', symbol: 'TST', decimals: 16 },
        amount: '100',
        nonce: '',
        resetTimeMin: '',
        lastResetMin: '',
        spent: '30',
      }

      const mockToken = {
        balance: '100',
        fiatBalance: '100',
        fiatConversion: '1',
        tokenInfo: {
          address: '0x1',
          decimals: 18,
          logoUri: '',
          name: 'Test Token',
          symbol: 'TST',
          type: TokenType.ERC20,
        },
      }

      const mockToken1 = {
        balance: '60',
        fiatBalance: '60',
        fiatConversion: '1',
        tokenInfo: {
          address: '0x2',
          decimals: 18,
          logoUri: '',
          name: 'Test Token 1',
          symbol: 'TST1',
          type: TokenType.ERC20,
        },
      }
      const balance: SafeBalanceResponse = {
        fiatTotal: '200',
        items: [mockToken, mockToken1],
      }

      jest.spyOn(spendingLimitBeneficiary, 'default').mockReturnValue(true)
      jest.spyOn(visibleBalances, 'useVisibleBalances').mockReturnValue({
        balances: balance,
        loading: false,
        loaded: true,
      })

      jest.spyOn(wallet, 'default').mockReturnValue(connectedWalletBuilder().with({ address: '0x3' }).build())

      const { result } = renderHook(() => useVisibleTokens(), {
        initialReduxState: { spendingLimits: { data: [mockSpendingLimitToken], loading: false, loaded: true } },
      })

      expect(result.current).toStrictEqual([mockToken])
    })
  })
})
