import {
  ConflictType,
  DetailedExecutionInfoType,
  LabelValue,
  TransactionListItemType,
} from '@safe-global/store/gateway/types'
import type { QueuedItemPage, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import usePendingActions from '@/hooks/usePendingActions'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { renderHook, waitFor } from '@/tests/test-utils'
import { toBeHex } from 'ethers'
import type { EIP1193Provider } from '@web3-onboard/core'
import * as useWallet from '@/hooks/wallets/useWallet'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useTxQueue from '@/hooks/useTxQueue'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'

jest.mock('@/hooks/useTxQueue')

const mockUseTxQueue = useTxQueue.default as jest.MockedFunction<typeof useTxQueue.default>

describe('usePendingActions hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock for useTxQueue
    mockUseTxQueue.mockReturnValue({
      page: undefined,
      error: undefined,
      loading: false,
    })
  })

  it('should return no pending actions for non-current Safe with an empty queue', () => {
    const chainId = '5'
    const safeAddress = toBeHex('0x1', 20)

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${chainId}/safes/${safeAddress}/transactions/queued`, () => {
        return HttpResponse.json({
          next: undefined,
          previous: undefined,
          results: [],
        })
      }),
    )

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

    const emptyPage: QueuedItemPage = {
      next: undefined,
      previous: undefined,
      results: [],
    }

    mockUseTxQueue.mockReturnValue({
      page: emptyPage,
      error: undefined,
      loading: false,
    })

    const { result } = renderHook(() => usePendingActions(chainId, safeAddress))
    expect(result.current).toEqual({ totalQueued: '', totalToSign: '' })
  })

  it('should return 2 queued txs and 1 pending signature for non-current Safe with a queue', async () => {
    const chainId = '5'
    const safeAddress = toBeHex('0x1', 20)
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

    const page: QueuedItemPage = {
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
          } as unknown as Transaction,
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
          } as unknown as Transaction,
          conflictType: ConflictType.END,
        },
      ],
    }

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${chainId}/safes/${safeAddress}/transactions/queued`, () => {
        return HttpResponse.json(page)
      }),
    )

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

    const page: QueuedItemPage = {
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
          } as unknown as Transaction,
          conflictType: ConflictType.NONE,
        },
      ],
    }

    const chainId = '5'

    mockUseTxQueue.mockReturnValue({
      page,
      error: undefined,
      loading: false,
    })

    const { result } = renderHook(() => usePendingActions(chainId, safeAddress))

    expect(result.current).toEqual({ totalQueued: '1', totalToSign: '1' })
  })
})
