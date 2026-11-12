import { mockAddress } from '@/stories/mocks/address'
import type { DraftBatchItem } from '@/features/batching/store'
import { OperationType } from '@safe-global/types-kit'

export const mockedDraftBatch: DraftBatchItem[] = [
  {
    id: 'kq3Zt8mWb1',
    timestamp: 1726820415651,
    txData: {
      to: mockAddress(1),
      value: '2500000000000',
      data: '0x',
      operation: OperationType.Call,
    },
  },
  {
    id: 'Hx7pLc2Rv9',
    timestamp: 1726820415652,
    txData: {
      to: mockAddress(2),
      value: '7300000000000',
      data: '0x',
      operation: OperationType.Call,
    },
  },
]
