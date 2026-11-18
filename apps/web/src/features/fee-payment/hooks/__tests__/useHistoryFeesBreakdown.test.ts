import { act, waitFor } from '@testing-library/react'
import { renderHook } from '@/tests/test-utils'
import { useHistoryFeesBreakdown } from '../useHistoryFeesBreakdown'
import * as useChainsModule from '@/hooks/useChains'
import * as useBalancesModule from '@/hooks/useBalances'
import * as web3Module from '@/hooks/wallets/web3'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import { chainBuilder } from '@/tests/builders/chains'
import { Errors } from '@/services/exceptions'
import { FetchResponse, id } from 'ethers'
import { RHINESTONE_INTENT_EXECUTOR, RHINESTONE_RELAYER } from '../../constants'

const mockLogError = jest.fn()
jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: (...args: unknown[]) => mockLogError(...args),
}))

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const REFUND_RECEIVER = '0x0C51b4d70492D81f9f96B1EB1a826FBfb3fd27d8'
const TX_HASH = '0x257151cef22c9f9f7b8e1931dda6fe03c8f9dbc0dca3465cb4f4c354b484f1e5'
const OWNER = '0x56f9403170Cc799C524Dcfc1c373Ee874b41AA0D'
const OTHER_ACCOUNT = '0x1111111111111111111111111111111111111111'
const INTENT_EXECUTED_LOG = { address: RHINESTONE_INTENT_EXECUTOR, topics: [id('IntentExecuted(uint256,bytes32)')] }

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
    refundReceiver: { value: REFUND_RECEIVER },
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
    executor: { value: OWNER },
    signers: [{ value: OWNER }],
    // gasUsed 120000 × gasPrice 20 gwei = 0.0024 ETH
    fee: '2400000000000000',
  },
} as unknown as TransactionDetails

const executedBy = (executor: string): TransactionDetails =>
  ({
    ...mockSignerPaysTx,
    detailedExecutionInfo: { ...mockSignerPaysTx.detailedExecutionInfo, executor: { value: executor } },
  }) as unknown as TransactionDetails

const mockModuleTx = {
  executedAt: 1700000001000,
  detailedExecutionInfo: { type: DetailedExecutionInfoType.MODULE },
} as unknown as TransactionDetails

type MockReceipt = { gasUsed: bigint; gasPrice: bigint; logs?: Array<{ address: string; topics: string[] }> }

const buildProvider = (receipt: MockReceipt | null) =>
  ({
    getTransactionReceipt: jest.fn().mockResolvedValue(receipt && { logs: [], ...receipt }),
  }) as unknown as ReturnType<typeof web3Module.useWeb3ReadOnly> & { getTransactionReceipt: jest.Mock }

// A provider whose receipt resolves only when the test says so, to assert after the fetch settles
const buildDeferredProvider = (receipt: MockReceipt) => {
  let resolve: () => void = () => {}
  const fetched = new Promise<void>((res) => (resolve = res))
  const provider = {
    getTransactionReceipt: jest.fn(() => fetched.then(() => ({ logs: [], ...receipt }))),
  } as unknown as ReturnType<typeof web3Module.useWeb3ReadOnly> & { getTransactionReceipt: jest.Mock }
  const settle = () =>
    act(async () => {
      resolve()
      await fetched
    })
  return { provider, settle }
}

const buildFailingProvider = (error: unknown) =>
  ({ getTransactionReceipt: jest.fn().mockRejectedValue(error) }) as unknown as ReturnType<
    typeof web3Module.useWeb3ReadOnly
  > & { getTransactionReceipt: jest.Mock }

describe('useHistoryFeesBreakdown', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)
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
    it('takes the gas fee from the tx fee, without an RPC call', () => {
      const provider = buildProvider(null)
      jest.spyOn(web3Module, 'useWeb3ReadOnly').mockReturnValue(provider)

      const { result } = renderHook(() => useHistoryFeesBreakdown(mockSignerPaysTx))

      expect(result.current?.paidFrom).toBe('signer')
      expect(result.current?.gasFee).toEqual(
        expect.objectContaining({ label: 'Max gas fee', currency: 'ETH', amount: '0.0024' }),
      )
      expect(result.current?.gasFee.fiatAmount).toBeDefined()
      expect(result.current?.executionFee).toEqual({ label: 'Execution fee', isFree: true })
      expect(provider.getTransactionReceipt).not.toHaveBeenCalled()
    })

    it("shows no breakdown when CGW has no fee for the tx ('0')", () => {
      const noFeeTx = {
        ...mockSignerPaysTx,
        detailedExecutionInfo: { ...mockSignerPaysTx.detailedExecutionInfo, fee: '0' },
      } as unknown as TransactionDetails

      const { result } = renderHook(() => useHistoryFeesBreakdown(noFeeTx))

      expect(result.current).toBeNull()
    })

    it('counts an executor who confirmed as the signer, even if no longer an owner', () => {
      const removedOwnerTx = {
        ...mockSignerPaysTx,
        detailedExecutionInfo: {
          ...mockSignerPaysTx.detailedExecutionInfo,
          executor: { value: OTHER_ACCOUNT },
          confirmations: [{ signer: { value: OTHER_ACCOUNT } }],
        },
      } as unknown as TransactionDetails

      const { result } = renderHook(() => useHistoryFeesBreakdown(removedOwnerTx))

      expect(result.current?.paidFrom).toBe('signer')
    })
  })

  describe('Sponsored', () => {
    const relayerReceipt = { gasUsed: 77_692n, gasPrice: 1_000_019n }

    it('marks a tx executed by the Rhinestone relayer as sponsored, without an RPC call', () => {
      const provider = buildProvider(relayerReceipt)
      jest.spyOn(web3Module, 'useWeb3ReadOnly').mockReturnValue(provider)

      const { result } = renderHook(() => useHistoryFeesBreakdown(executedBy(RHINESTONE_RELAYER)))

      expect(result.current?.paidFrom).toBe('sponsored')
      expect(result.current?.gasFee).toEqual(
        expect.objectContaining({ isFree: true, currency: 'ETH', amount: '0.0024' }),
      )
      expect(provider.getTransactionReceipt).not.toHaveBeenCalled()
    })

    it("marks a tx as sponsored from Rhinestone's IntentExecuted log when the executor is unknown", async () => {
      jest
        .spyOn(web3Module, 'useWeb3ReadOnly')
        .mockReturnValue(buildProvider({ ...relayerReceipt, logs: [INTENT_EXECUTED_LOG] }))

      const { result } = renderHook(() => useHistoryFeesBreakdown(executedBy(OTHER_ACCOUNT)))

      await waitFor(() => expect(result.current?.paidFrom).toBe('sponsored'))
      expect(result.current?.gasFee.amount).toBe('0.0024')
    })

    it('ignores an IntentExecuted log from any other contract', async () => {
      const { provider, settle } = buildDeferredProvider({
        ...relayerReceipt,
        logs: [{ ...INTENT_EXECUTED_LOG, address: OTHER_ACCOUNT }],
      })
      jest.spyOn(web3Module, 'useWeb3ReadOnly').mockReturnValue(provider)

      const { result } = renderHook(() => useHistoryFeesBreakdown(executedBy(OTHER_ACCOUNT)))
      await settle()

      expect(provider.getTransactionReceipt).toHaveBeenCalledTimes(1)
      expect(result.current).toBeNull()
    })

    it('fetches the receipt once across balance-poll-induced re-renders', async () => {
      const provider = buildProvider({ ...relayerReceipt, logs: [INTENT_EXECUTED_LOG] })
      jest.spyOn(web3Module, 'useWeb3ReadOnly').mockReturnValue(provider)

      const { result, rerender } = renderHook(() => useHistoryFeesBreakdown(executedBy(OTHER_ACCOUNT)))
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

  it('shows no breakdown when an unknown account executed, as we cannot say who paid', async () => {
    const { provider, settle } = buildDeferredProvider({ gasUsed: 120_000n, gasPrice: 20_000_000_000n })
    jest.spyOn(web3Module, 'useWeb3ReadOnly').mockReturnValue(provider)

    const { result } = renderHook(() => useHistoryFeesBreakdown(executedBy(OTHER_ACCOUNT)))
    await settle()

    expect(provider.getTransactionReceipt).toHaveBeenCalledTimes(1)
    expect(result.current).toBeNull()
  })

  it('shows no breakdown for an unknown executor when the tx has no hash to fetch', () => {
    const provider = buildProvider(null)
    jest.spyOn(web3Module, 'useWeb3ReadOnly').mockReturnValue(provider)
    const noHashTx = { ...executedBy(OTHER_ACCOUNT), txHash: undefined } as unknown as TransactionDetails

    const { result } = renderHook(() => useHistoryFeesBreakdown(noHashTx))

    expect(result.current).toBeNull()
    expect(provider.getTransactionReceipt).not.toHaveBeenCalled()
  })

  it('never fetches the receipt for Safe-pays txs', async () => {
    const provider = buildProvider(null)
    jest.spyOn(web3Module, 'useWeb3ReadOnly').mockReturnValue(provider)

    const { result } = renderHook(() => useHistoryFeesBreakdown(mockSafePaysTx))

    await waitFor(() => expect(result.current).not.toBeNull())
    expect(provider.getTransactionReceipt).not.toHaveBeenCalled()
  })

  it('returns null when GTF feature is disabled', async () => {
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(false)

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

  describe('receipt-fetch logging', () => {
    it('logs a failed receipt fetch as 623, not as a gas-estimation failure', async () => {
      // The call is `getTransactionReceipt`, which cannot revert — 612
      // ("Error estimating gas") mislabelled it and polluted the
      // gas_estimation_failed facet.
      jest
        .spyOn(web3Module, 'useWeb3ReadOnly')
        .mockReturnValue(buildFailingProvider(new Error('HTTP request failed. Status: 500')))

      const { result } = renderHook(() => useHistoryFeesBreakdown(executedBy(OTHER_ACCOUNT)))

      await waitFor(() => expect(mockLogError).toHaveBeenCalled())
      expect(mockLogError).toHaveBeenCalledWith(
        Errors._623,
        expect.objectContaining({ message: 'HTTP request failed. Status: 500' }),
        expect.anything(),
      )
      expect(result.current).toBeNull()
    })

    it('does not log a transient throttle from the ethers provider', async () => {
      // The provider here is ethers, so the throttle arrives in ethers' shape:
      // a SERVER_ERROR escalated from the 429 it already retried.
      let throttled: unknown
      try {
        new FetchResponse(429, 'Too Many Requests', {}, null, undefined)
          .makeServerError('exceeded maximum retry limit')
          .assertOk()
      } catch (error) {
        throttled = error
      }
      const provider = buildFailingProvider(throttled)
      jest.spyOn(web3Module, 'useWeb3ReadOnly').mockReturnValue(provider)

      const { result } = renderHook(() => useHistoryFeesBreakdown(executedBy(OTHER_ACCOUNT)))

      await waitFor(() => expect(provider.getTransactionReceipt).toHaveBeenCalled())
      await act(async () => {})
      expect(result.current).toBeNull()
      expect(mockLogError).not.toHaveBeenCalled()
    })
  })
})
