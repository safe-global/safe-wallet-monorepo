import { PendingStatus } from '@/store/pendingTxsSlice'
import type { PendingTx } from '@/store/pendingTxsSlice'
import { Builder, type IBuilder } from '@safe-global/utils/tests/Builder'
import { faker } from '@faker-js/faker'

export function pendingTxBuilder(): IBuilder<PendingTx> {
  return Builder.new<PendingTx>().with({
    chainId: faker.string.numeric(),
    safeAddress: faker.finance.ethereumAddress(),
    nonce: faker.number.int(),
    groupKey: faker.string.hexadecimal(),
    status: faker.helpers.enumValue(PendingStatus),
  })
}
