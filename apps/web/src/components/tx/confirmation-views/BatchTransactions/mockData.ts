import { faker } from '@faker-js/faker'
import type { DraftBatchItem } from '@/store/batchSlice'
import { OperationType } from '@safe-global/types-kit'

export const mockedDraftBatch: DraftBatchItem[] = [
  {
    id: faker.string.alphanumeric(10),
    timestamp: 1726820415651,
    txData: {
      to: faker.finance.ethereumAddress(),
      value: faker.number.bigInt({ min: 1000000000000n, max: 10000000000000n }).toString(),
      data: '0x',
      operation: OperationType.Call,
    },
  },
  {
    id: faker.string.alphanumeric(10),
    timestamp: 1726820415652,
    txData: {
      to: faker.finance.ethereumAddress(),
      value: faker.number.bigInt({ min: 1000000000000n, max: 10000000000000n }).toString(),
      data: '0x',
      operation: OperationType.Call,
    },
  },
]
