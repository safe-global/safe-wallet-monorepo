import type { DraftBatchItem } from '@/store/batchSlice'
import { OperationType } from '@safe-global/types-kit'

export const mockedDraftBatch: DraftBatchItem[] = [
  {
    id: '6283sw7pzyk',
    timestamp: 1726820415651,
    txData: {
      to: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
      value: '1000000000000',
      data: '0x',
      operation: OperationType.Call,
    },
  },
  {
    id: 'abc123def456',
    timestamp: 1726820415652,
    txData: {
      to: '0x1234567890123456789012345678901234567890',
      value: '500000000000',
      data: '0x',
      operation: OperationType.Call,
    },
  },
]
