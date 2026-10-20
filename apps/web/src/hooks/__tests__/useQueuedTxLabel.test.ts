import type { Transaction, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { renderHook } from '@/tests/test-utils'
import useQueuedTxLabel, { getQueuedTxLabel } from '@/hooks/useQueuedTxLabel'

jest.mock('@/hooks/useTxQueue')
jest.mock('@/hooks/useAddressBook', () => ({
  __esModule: true,
  default: () => ({}),
}))

const mockUseQueuedTxByNonce = jest.requireMock('@/hooks/useTxQueue').useQueuedTxByNonce as jest.Mock

const customTx = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    id: 'tx-custom',
    timestamp: 0,
    txStatus: 'AWAITING_CONFIRMATIONS',
    note: null,
    txInfo: {
      type: 'Custom',
      humanDescription: null,
      to: { value: '0x0000000000000000000000000000000000000001' },
      dataSize: '0',
      value: '0',
      isCancellation: false,
      methodName: null,
      actionCount: null,
    },
    ...overrides,
  }) as Transaction

const settingsTx = (settingsType: string): Transaction =>
  ({
    id: 'tx-settings',
    timestamp: 0,
    txStatus: 'AWAITING_CONFIRMATIONS',
    note: null,
    txInfo: {
      type: 'SettingsChange',
      humanDescription: null,
      dataDecoded: { method: 'addOwnerWithThreshold', parameters: [] },
      settingsInfo: { type: settingsType },
    },
  }) as unknown as Transaction

const queued = (transaction: Transaction): TransactionQueuedItem => ({
  type: 'TRANSACTION',
  conflictType: 'None',
  transaction,
})

describe('getQueuedTxLabel', () => {
  it('uses the note when present', () => {
    expect(getQueuedTxLabel(customTx({ note: 'Treasury payout' }), {})).toBe('Treasury payout')
  })

  it('falls back to the human description when the note is blank', () => {
    const tx = customTx({ note: '   ' })
    tx.txInfo.humanDescription = 'Send 1 ETH to alice.eth'

    expect(getQueuedTxLabel(tx, {})).toBe('Send 1 ETH to alice.eth')
  })

  it.each([
    ['ADD_OWNER', 'Add signer'],
    ['REMOVE_OWNER', 'Remove signer'],
    ['SWAP_OWNER', 'Replace signer'],
    ['CHANGE_THRESHOLD', 'Change threshold'],
    ['DELETE_GUARD', 'Remove guard'],
    ['CHANGE_MASTER_COPY', 'Update Safe version'],
  ])('names a %s settings change "%s"', (settingsType, label) => {
    expect(getQueuedTxLabel(settingsTx(settingsType), {})).toBe(label)
  })

  it('falls back to the transaction type for other transactions', () => {
    expect(getQueuedTxLabel(customTx(), {})).toBe('Contract interaction transaction')
  })
})

describe('useQueuedTxLabel', () => {
  it('returns no label when nothing is queued at the nonce', () => {
    mockUseQueuedTxByNonce.mockReturnValue([])

    const { result } = renderHook(() => useQueuedTxLabel(4))

    expect(result.current).toEqual({ label: undefined, count: 0 })
  })

  it('labels the latest transaction and counts every transaction at the nonce', () => {
    mockUseQueuedTxByNonce.mockReturnValue([
      queued(customTx({ note: 'Latest' })),
      queued(customTx({ note: 'Older' })),
      queued(customTx({ note: 'Oldest' })),
    ])

    const { result } = renderHook(() => useQueuedTxLabel(4))

    expect(result.current).toEqual({ label: 'Latest', count: 3 })
  })
})
