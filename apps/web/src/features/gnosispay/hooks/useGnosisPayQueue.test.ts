import { faker } from '@faker-js/faker'
import { type JsonRpcProvider } from 'ethers'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { _getRecoveryStateItem, type RecoveryQueueItem, type RecoveryStateItem } from '@/features/recovery/services'
import { logError, Errors } from '@/services/exceptions'
import { _toGnosisPayQueue, refreshGnosisPayQueue, useGnosisPayQueue } from './useGnosisPayQueue'

const mockUseGnosisPayDelayModule = jest.fn()
const mockProvider = {} as JsonRpcProvider

jest.mock('./useGnosisPayDelayModule', () => ({
  useGnosisPayDelayModule: () => mockUseGnosisPayDelayModule(),
}))

jest.mock('@/hooks/wallets/web3', () => ({
  ...jest.requireActual('@/hooks/wallets/web3'),
  useWeb3ReadOnly: () => mockProvider,
}))

jest.mock('@gnosis.pm/zodiac', () => ({
  ...jest.requireActual('@gnosis.pm/zodiac'),
  getModuleInstance: jest.fn(),
}))

jest.mock('@/features/recovery/services', () => ({
  ...jest.requireActual('@/features/recovery/services'),
  _getRecoveryStateItem: jest.fn(),
}))

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockGetRecoveryStateItem = jest.mocked(_getRecoveryStateItem)

const buildQueueItem = ({
  queueNonce,
  operation = 0n,
  expiresAt = 2_000_000n,
}: {
  queueNonce: number
  operation?: bigint
  expiresAt?: bigint | null
}) =>
  ({
    args: {
      queueNonce: BigInt(queueNonce),
      to: faker.finance.ethereumAddress(),
      value: BigInt(faker.number.int({ max: 1_000 })),
      data: faker.string.hexadecimal({ length: 8 }),
      operation,
    },
    validFrom: 1_000_000n,
    expiresAt,
  }) as RecoveryQueueItem

const resolveQueue = (queue: RecoveryQueueItem[]) =>
  mockGetRecoveryStateItem.mockResolvedValue({ queue } as RecoveryStateItem)

describe('_toGnosisPayQueue', () => {
  it('maps Delay queue items to their execution window, sorted by nonce', () => {
    const later = buildQueueItem({ queueNonce: 5 })
    const earlier = buildQueueItem({ queueNonce: 4, operation: 1n })

    expect(_toGnosisPayQueue([later, earlier])).toEqual([
      {
        queueNonce: 4,
        txData: {
          to: earlier.args.to,
          value: earlier.args.value.toString(),
          data: earlier.args.data,
          operation: 1,
        },
        executableAt: 1_000_000,
        expiresAt: 2_000_000,
      },
      expect.objectContaining({ queueNonce: 5 }),
    ])
  })

  it('keeps a null expiry for a Delay modifier without expiration', () => {
    const [item] = _toGnosisPayQueue([buildQueueItem({ queueNonce: 0, expiresAt: null })])

    expect(item.expiresAt).toBeNull()
  })
})

describe('useGnosisPayQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGnosisPayDelayModule.mockReturnValue([{ value: faker.finance.ethereumAddress() }, undefined, false])
  })

  it('does not read the chain on a Safe without a Gnosis Pay Delay modifier', async () => {
    mockUseGnosisPayDelayModule.mockReturnValue([undefined, undefined, false])

    const { result } = renderHook(() => useGnosisPayQueue())

    await waitFor(() => expect(result.current[2]).toBe(false))
    expect(result.current[0]).toBeUndefined()
    expect(mockGetRecoveryStateItem).not.toHaveBeenCalled()
  })

  it('returns the on-chain Delay queue sorted by nonce', async () => {
    resolveQueue([buildQueueItem({ queueNonce: 1 }), buildQueueItem({ queueNonce: 0 })])

    const { result } = renderHook(() => useGnosisPayQueue())

    await waitFor(() => expect(result.current[0]?.map((item) => item.queueNonce)).toEqual([0, 1]))
  })

  it('refetches the queue when refreshGnosisPayQueue is called', async () => {
    resolveQueue([])
    const { result } = renderHook(() => useGnosisPayQueue())
    await waitFor(() => expect(result.current[0]).toEqual([]))

    resolveQueue([buildQueueItem({ queueNonce: 0 })])
    act(() => refreshGnosisPayQueue())

    await waitFor(() => expect(result.current[0]).toHaveLength(1))
  })

  it('logs and surfaces the error when the Delay queue cannot be read', async () => {
    const error = new Error('RPC unavailable')
    mockGetRecoveryStateItem.mockRejectedValue(error)

    const { result } = renderHook(() => useGnosisPayQueue())

    await waitFor(() => expect(result.current[1]?.message).toBe('RPC unavailable'))
    expect(logError).toHaveBeenCalledWith(Errors._603, error)
  })
})
