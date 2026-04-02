import { renderHook } from '@/tests/test-utils'
import useTransferFiatValue from './useTransferFiatValue'
import * as useTrustedTokenBalances from '@/hooks/loadables/useTrustedTokenBalances'
import { TokenType, TransactionTokenType } from '@safe-global/store/gateway/types'
import type { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { parseUnits } from 'ethers'

type TransferInfo = TransferTransactionInfo['transferInfo']

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const mockBalances = {
  fiatTotal: '2000',
  items: [
    {
      balance: '1000000000000000000',
      tokenInfo: {
        address: ZERO_ADDRESS,
        decimals: 18,
        logoUri: '',
        name: 'Ether',
        symbol: 'ETH',
        type: TokenType.NATIVE_TOKEN,
      },
      fiatBalance: '2000',
      fiatConversion: '2000',
    },
    {
      balance: '1000000000',
      tokenInfo: {
        address: USDC_ADDRESS,
        decimals: 6,
        logoUri: '',
        name: 'USD Coin',
        symbol: 'USDC',
        type: TokenType.ERC20,
      },
      fiatBalance: '1000',
      fiatConversion: '1',
    },
  ],
}

const useTrustedTokenBalancesSpy = jest.spyOn(useTrustedTokenBalances, 'useTrustedTokenBalances')

describe('useTransferFiatValue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useTrustedTokenBalancesSpy.mockReturnValue([mockBalances, undefined, false])
  })

  it('should return fiat value for an ERC20 transfer', () => {
    const transferInfo: TransferInfo = {
      type: TransactionTokenType.ERC20,
      tokenAddress: USDC_ADDRESS,
      value: parseUnits('100', 6).toString(),
      tokenName: 'USD Coin',
      tokenSymbol: 'USDC',
      decimals: 6,
      trusted: true,
      imitation: false,
    }

    const { result } = renderHook(() => useTransferFiatValue(transferInfo))

    // 100 USDC * $1 fiatConversion = $100
    expect(result.current).toBe(100)
  })

  it('should return fiat value for a native token transfer', () => {
    const transferInfo: TransferInfo = {
      type: TransactionTokenType.NATIVE_COIN,
      value: parseUnits('0.5', 18).toString(),
    }

    const { result } = renderHook(() => useTransferFiatValue(transferInfo))

    // 0.5 ETH * $2000 fiatConversion = $1000
    expect(result.current).toBe(1000)
  })

  it('should return null when balances are not loaded', () => {
    useTrustedTokenBalancesSpy.mockReturnValue([undefined, undefined, true])

    const transferInfo: TransferInfo = {
      type: TransactionTokenType.ERC20,
      tokenAddress: USDC_ADDRESS,
      value: parseUnits('100', 6).toString(),
      tokenName: 'USD Coin',
      tokenSymbol: 'USDC',
      decimals: 6,
      trusted: true,
      imitation: false,
    }

    const { result } = renderHook(() => useTransferFiatValue(transferInfo))

    expect(result.current).toBeNull()
  })

  it('should return null when transferInfo is undefined', () => {
    const { result } = renderHook(() => useTransferFiatValue(undefined))

    expect(result.current).toBeNull()
  })

  it('should return null when token is not found in balances', () => {
    const transferInfo: TransferInfo = {
      type: TransactionTokenType.ERC20,
      tokenAddress: '0x0000000000000000000000000000000000000001',
      value: parseUnits('100', 18).toString(),
      tokenName: 'Unknown',
      tokenSymbol: 'UNK',
      decimals: 18,
      trusted: true,
      imitation: false,
    }

    const { result } = renderHook(() => useTransferFiatValue(transferInfo))

    expect(result.current).toBeNull()
  })

  it('should return null when fiatConversion is "0"', () => {
    useTrustedTokenBalancesSpy.mockReturnValue([
      {
        fiatTotal: '0',
        items: [
          {
            ...mockBalances.items[1],
            fiatConversion: '0',
          },
        ],
      },
      undefined,
      false,
    ])

    const transferInfo: TransferInfo = {
      type: TransactionTokenType.ERC20,
      tokenAddress: USDC_ADDRESS,
      value: parseUnits('100', 6).toString(),
      tokenName: 'USD Coin',
      tokenSymbol: 'USDC',
      decimals: 6,
      trusted: true,
      imitation: false,
    }

    const { result } = renderHook(() => useTransferFiatValue(transferInfo))

    expect(result.current).toBeNull()
  })

  it('should return null when fiatConversion is empty string', () => {
    useTrustedTokenBalancesSpy.mockReturnValue([
      {
        fiatTotal: '0',
        items: [
          {
            balance: '1000000000',
            tokenInfo: mockBalances.items[1].tokenInfo,
            fiatBalance: '0',
            fiatConversion: '',
          },
        ],
      },
      undefined,
      false,
    ])

    const transferInfo: TransferInfo = {
      type: TransactionTokenType.ERC20,
      tokenAddress: USDC_ADDRESS,
      value: parseUnits('100', 6).toString(),
      tokenName: 'USD Coin',
      tokenSymbol: 'USDC',
      decimals: 6,
      trusted: true,
      imitation: false,
    }

    const { result } = renderHook(() => useTransferFiatValue(transferInfo))

    expect(result.current).toBeNull()
  })

  it('should return null for an ERC721 (NFT) transfer', () => {
    const transferInfo: TransferInfo = {
      type: TransactionTokenType.ERC721,
      tokenAddress: '0x1234567890123456789012345678901234567890',
      tokenId: '1',
      tokenName: 'TestNFT',
      tokenSymbol: 'TNFT',
      trusted: true,
    }

    const { result } = renderHook(() => useTransferFiatValue(transferInfo))

    expect(result.current).toBeNull()
  })

  it('should return null when transfer value is "0"', () => {
    const transferInfo: TransferInfo = {
      type: TransactionTokenType.ERC20,
      tokenAddress: USDC_ADDRESS,
      value: '0',
      tokenName: 'USD Coin',
      tokenSymbol: 'USDC',
      decimals: 6,
      trusted: true,
      imitation: false,
    }

    const { result } = renderHook(() => useTransferFiatValue(transferInfo))

    expect(result.current).toBeNull()
  })

  it('should return null when enabled is false', () => {
    const transferInfo: TransferInfo = {
      type: TransactionTokenType.ERC20,
      tokenAddress: USDC_ADDRESS,
      value: parseUnits('100', 6).toString(),
      tokenName: 'USD Coin',
      tokenSymbol: 'USDC',
      decimals: 6,
      trusted: true,
      imitation: false,
    }

    const { result } = renderHook(() => useTransferFiatValue(transferInfo, false))

    expect(result.current).toBeNull()
  })
})
