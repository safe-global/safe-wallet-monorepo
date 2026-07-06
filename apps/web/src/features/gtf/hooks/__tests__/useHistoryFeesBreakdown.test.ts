import { waitFor } from '@testing-library/react'
import { renderHook } from '@/tests/test-utils'
import { useHistoryFeesBreakdown } from '../useHistoryFeesBreakdown'
import * as useChainsModule from '@/hooks/useChains'
import * as useBalancesModule from '@/hooks/useBalances'
import * as web3Module from '@/hooks/wallets/web3'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import { chainBuilder } from '@/tests/builders/chains'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const GELATO_COLLECTOR = '0xc918e75504D1B0c741Eb4236B72Dae7A52401E95'
const TX_HASH = '0x257151cef22c9f9f7b8e1931dda6fe03c8f9dbc0dca3465cb4f4c354b484f1e5'

const mockChain = chainBuilder()
  .with({ chainId: '1', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'https://eth.logo' } })
  .build()

const buildBalances = (items: unknown[] = []): ReturnType<typeof useBalancesModule.default> => ({
  balances: { fiatTotal: '1000', items: items as never },
  loaded: true,
  loading: false,
})

const wethBalance = {
  balance: '10000000000000000',
  fiatBalance: '25',
  fiatConversion: '2500',
  tokenInfo: {
    address: WETH,
    decimals: 18,
    logoUri: 'https://weth.logo',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    type: 'ERC20',
  },
}

const nativeBalance = {
  balance: '1000000000000000000',
  fiatBalance: '2500',
  fiatConversion: '2500',
  tokenInfo: {
    address: ZERO_ADDRESS,
    decimals: 18,
    logoUri: 'https://eth.logo',
    name: 'Ether',
    symbol: 'ETH',
    type: 'NATIVE_TOKEN',
  },
}

const mockSafePaysTx = {
  executedAt: 1700000001000,
  txHash: TX_HASH,
  detailedExecutionInfo: {
    type: DetailedExecutionInfoType.MULTISIG,
    safeTxGas: '10148',
    baseGas: '68628',
    gasPrice: '1301068116',
    gasToken: WETH,
    gasTokenInfo: { symbol: 'WETH', decimals: 18, logoUri: 'https://weth.logo' },
    refundReceiver: { value: GELATO_COLLECTOR },
    payment: '102508541265216',
  },
} as unknown as TransactionDetails

const mockSignerPaysTx = {
  executedAt: 1700000001000,
  txHash: TX_HASH,
  detailedExecutionInfo: {
    type: DetailedExecutionInfoType.MULTISIG,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZERO_ADDRESS,
    refundReceiver: { value: ZERO_ADDRESS },
  },
} as unknown as TransactionDetails

const mockModuleTx = {
  executedAt: 1700000001000,
  detailedExecutionInfo: { type: DetailedExecutionInfoType.MODULE },
} as unknown as TransactionDetails

const buildProvider = (receipt: { gasUsed: bigint; gasPrice: bigint } | null) =>
  ({ getTransactionReceipt: jest.fn().mockResolvedValue(receipt) }) as unknown as ReturnType<
    typeof web3Module.useWeb3ReadOnly
  > & { getTransactionReceipt: jest.Mock }

describe('useHistoryFeesBreakdown', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(useChainsModule, 'useIsUnlimitedRelay').mockReturnValue(true)
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(mockChain)
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([nativeBalance, wethBalance]))
    jest.spyOn(web3Module, 'useWeb3ReadOnly').mockReturnValue(buildProvider(null))
  })

  describe('Safe-pays', () => {
    it('derives the gas fee from the signed payload', async () => {
      const { result } = renderHook(() => useHistoryFeesBreakdown(mockSafePaysTx))

      await waitFor(() => expect(result.current).not.toBeNull())
      expect(result.current?.gasFee).toEqual(expect.objectContaining({ label: 'Max gas fee', currency: 'WETH' }))
      expect(result.current?.gasFee.amount).toMatch(/^0\.0001/)
      expect(result.current?.gasFee.fiatAmount).toBeDefined()
    })

    it('renders the execution fee as free with no amount', async () => {
      const { result } = renderHook(() => useHistoryFeesBreakdown(mockSafePaysTx))

      await waitFor(() => expect(result.current).not.toBeNull())
      expect(result.current?.executionFee).toEqual({ label: 'Execution fee', isFree: true })
    })

    it('mirrors total to gasFee while execution fee is free', async () => {
      const { result } = renderHook(() => useHistoryFeesBreakdown(mockSafePaysTx))

      await waitFor(() => expect(result.current).not.toBeNull())
      expect(result.current?.totalFee).toEqual({
        amount: result.current?.gasFee.amount,
        currency: result.current?.gasFee.currency,
        fiatAmount: result.current?.gasFee.fiatAmount,
      })
    })

    it('omits fiat when the Safe no longer holds the gas token', async () => {
      jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([]))

      const { result } = renderHook(() => useHistoryFeesBreakdown(mockSafePaysTx))

      await waitFor(() => expect(result.current).not.toBeNull())
      expect(result.current?.gasFee.fiatAmount).toBeUndefined()
    })
  })

  describe('Signer-pays', () => {
    it('reconstructs the gas fee from the on-chain receipt', async () => {
      // gasUsed: 120000, gasPrice: 20 gwei → 2.4e15 wei = 0.0024 ETH
      jest
        .spyOn(web3Module, 'useWeb3ReadOnly')
        .mockReturnValue(buildProvider({ gasUsed: 120_000n, gasPrice: 20_000_000_000n }))

      const { result } = renderHook(() => useHistoryFeesBreakdown(mockSignerPaysTx))

      await waitFor(() => expect(result.current).not.toBeNull())
      expect(result.current?.gasFee).toEqual(
        expect.objectContaining({ label: 'Max gas fee', currency: 'ETH', amount: '0.0024' }),
      )
      expect(result.current?.gasFee.fiatAmount).toBeDefined()
      expect(result.current?.executionFee).toEqual({ label: 'Execution fee', isFree: true })
    })

    it('returns null when the on-chain receipt is unavailable', async () => {
      jest.spyOn(web3Module, 'useWeb3ReadOnly').mockReturnValue(buildProvider(null))

      const { result } = renderHook(() => useHistoryFeesBreakdown(mockSignerPaysTx))

      await waitFor(() => expect(result.current).toBeNull())
    })

    it('returns null when txHash is missing', async () => {
      const noHashTx = { ...mockSignerPaysTx, txHash: undefined } as unknown as TransactionDetails

      const { result } = renderHook(() => useHistoryFeesBreakdown(noHashTx))

      await waitFor(() => expect(result.current).toBeNull())
    })

    it('fetches the receipt once across balance-poll-induced re-renders', async () => {
      const provider = buildProvider({ gasUsed: 120_000n, gasPrice: 20_000_000_000n })
      jest.spyOn(web3Module, 'useWeb3ReadOnly').mockReturnValue(provider)

      const { result, rerender } = renderHook(() => useHistoryFeesBreakdown(mockSignerPaysTx))
      await waitFor(() => expect(result.current).not.toBeNull())

      // Simulate balance polling — new items array reference, same underlying data.
      jest
        .spyOn(useBalancesModule, 'default')
        .mockReturnValue(buildBalances([{ ...nativeBalance }, { ...wethBalance }]))
      rerender()
      rerender()

      expect(provider.getTransactionReceipt).toHaveBeenCalledTimes(1)
    })
  })

  it('never fetches the receipt for Safe-pays txs', async () => {
    const provider = buildProvider(null)
    jest.spyOn(web3Module, 'useWeb3ReadOnly').mockReturnValue(provider)

    const { result } = renderHook(() => useHistoryFeesBreakdown(mockSafePaysTx))

    await waitFor(() => expect(result.current).not.toBeNull())
    expect(provider.getTransactionReceipt).not.toHaveBeenCalled()
  })

  it('returns null when GTF feature is disabled', async () => {
    jest.spyOn(useChainsModule, 'useIsUnlimitedRelay').mockReturnValue(false)

    const { result } = renderHook(() => useHistoryFeesBreakdown(mockSafePaysTx))

    await waitFor(() => expect(result.current).toBeNull())
  })

  it('returns null for module-executed transactions', async () => {
    const { result } = renderHook(() => useHistoryFeesBreakdown(mockModuleTx))

    await waitFor(() => expect(result.current).toBeNull())
  })

  it('returns null for unexecuted (queued) transactions', async () => {
    const queuedTx = { ...mockSafePaysTx, executedAt: undefined } as unknown as TransactionDetails

    const { result } = renderHook(() => useHistoryFeesBreakdown(queuedTx))

    await waitFor(() => expect(result.current).toBeNull())
  })
})
