import usePendingActions from '@/hooks/usePendingActions'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { renderHook, waitFor } from '@/tests/test-utils'
import type { TransactionListPage, TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import {
  ConflictType,
  DetailedExecutionInfoType,
  LabelValue,
  TransactionListItemType,
} from '@safe-global/safe-gateway-typescript-sdk'
import { toBeHex } from 'ethers'
import type { EIP1193Provider } from '@web3-onboard/core'
import * as useWallet from '@/hooks/wallets/useWallet'
import * as useTxQueue from '@/hooks/useTxQueue'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { getTransactionQueue } from '@safe-global/safe-gateway-typescript-sdk'

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  ...jest.requireActual('@safe-global/safe-gateway-typescript-sdk'),
  getTransactionQueue: jest.fn(),
}))

describe('usePendingActions hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return no pending actions for non-current Safe with an empty queue', () => {
    const chainId = '5'
    const safeAddress = toBeHex('0x1', 20)

    ;(getTransactionQueue as jest.Mock).mockResolvedValue({
      next: undefined,
      previous: undefined,
      results: [],
    })

    const { result } = renderHook(() => usePendingActions(chainId, safeAddress))
    expect(result.current).toEqual({ totalQueued: '', totalToSign: '' })
  })

  it('should return no pending actions for current Safe with an empty queue', () => {
    const chainId = '5'
    const safeAddress = toBeHex('0x1', 20)

    const mockSafeAddress = toBeHex('0x1', 20)
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safeAddress: mockSafeAddress,
      safe: {
        ...extendedSafeInfoBuilder().build(),
        chainId: '5',
      },
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const mockPage = {
      error: undefined,
      loading: false,
      loaded: true,
      page: {
        next: undefined,
        previous: undefined,
        results: [],
      },
    }
    jest.spyOn(useTxQueue, 'default').mockReturnValue(mockPage)

    const { result } = renderHook(() => usePendingActions(chainId, safeAddress))
    expect(result.current).toEqual({ totalQueued: '', totalToSign: '' })
  })

  it('should return 2 queued txs and 1 pending signature for non-current Safe with a queue', async () => {
    const walletAddress = toBeHex('0x789', 20)
    const mockWallet = {
      address: walletAddress,
      chainId: '5',
      label: '',
      provider: null as unknown as EIP1193Provider,
    }
    jest.spyOn(useWallet, 'default').mockReturnValue({ ...mockWallet, provider: {} as EIP1193Provider })

    const mockSafeAddress = toBeHex('0x2', 20)
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safeAddress: mockSafeAddress,
      safe: {
        ...extendedSafeInfoBuilder().build(),
        chainId: '5',
      },
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const page: TransactionListPage = {
      next: undefined,
      previous: undefined,
      results: [
        { type: TransactionListItemType.LABEL, label: LabelValue.Next },
        { type: TransactionListItemType.CONFLICT_HEADER, nonce: 7 },
        {
          type: TransactionListItemType.TRANSACTION,
          transaction: {
            executionInfo: {
              type: DetailedExecutionInfoType.MULTISIG,
              nonce: 7,
              confirmationsRequired: 3,
              confirmationsSubmitted: 1,
              missingSigners: [
                { value: '0x6a5602335a878ADDCa4BF63a050E34946B56B5bC' },
                { value: '0x0000000000000000000000000000000000000789' },
              ],
            },
          } as unknown as TransactionSummary,
          conflictType: ConflictType.HAS_NEXT,
        },
        {
          type: TransactionListItemType.TRANSACTION,
          transaction: {
            executionInfo: {
              type: DetailedExecutionInfoType.MULTISIG,
              nonce: 7,
              confirmationsRequired: 3,
              confirmationsSubmitted: 3,
            },
          } as unknown as TransactionSummary,
          conflictType: ConflictType.END,
        },
      ],
    }

    ;(getTransactionQueue as jest.Mock).mockResolvedValue(page)

    const chainId = '5'
    const safeAddress = toBeHex('0x1', 20)

    const { result } = renderHook(() => usePendingActions(chainId, safeAddress))

    await waitFor(() => {
      expect(result.current).toEqual({ totalQueued: '2', totalToSign: '1' })
    })
  })

  it('should return 1 queued txs and 1 pending signature for current Safe with a queue', async () => {
    const safeAddress = toBeHex('0x1', 20)
    const walletAddress = toBeHex('0x789', 20)
    const mockWallet = {
      address: walletAddress,
      chainId: '5',
      label: '',
      provider: null as unknown as EIP1193Provider,
    }
    jest.spyOn(useWallet, 'default').mockReturnValue({ ...mockWallet, provider: {} as EIP1193Provider })

    const mockSafeAddress = toBeHex('0x1', 20)
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safeAddress: mockSafeAddress,
      safe: {
        ...extendedSafeInfoBuilder().build(),
        chainId: '5',
      },
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })

    const page: TransactionListPage = {
      next: undefined,
      previous: undefined,
      results: [
        { type: TransactionListItemType.LABEL, label: LabelValue.Next },
        {
          type: TransactionListItemType.TRANSACTION,
          transaction: {
            txStatus: 'AWAITING_CONFIRMATIONS',
            executionInfo: {
              type: DetailedExecutionInfoType.MULTISIG,
              nonce: 8,
              confirmationsRequired: 3,
              confirmationsSubmitted: 1,
              missingSigners: [
                { value: '0x6a5602335a878ADDCa4BF63a050E34946B56B5bC' },
                { value: '0x0000000000000000000000000000000000000789' },
              ],
            },
          } as unknown as TransactionSummary,
          conflictType: ConflictType.NONE,
        },
      ],
    }

    const mockPage = {
      error: undefined,
      loading: false,
      loaded: true,
      page,
    }
    jest.spyOn(useTxQueue, 'default').mockReturnValue(mockPage)

    const chainId = '5'

    const { result } = renderHook(() => usePendingActions(chainId, safeAddress))

    await waitFor(() => {
      expect(result.current).toEqual({ totalQueued: '1', totalToSign: '1' })
    })
  })
})
