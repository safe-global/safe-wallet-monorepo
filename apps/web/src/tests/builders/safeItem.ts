import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { Builder, type IBuilder } from '@/tests/Builder'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { faker } from '@faker-js/faker'

export function safeItemBuilder(): IBuilder<SafeItem> {
  const chainId = faker.helpers.arrayElement(['1', '11155111', '100', '10', '137'])

  return Builder.new<SafeItem>().with({
    chainId,
    address: checksumAddress(faker.finance.ethereumAddress()),
    isReadOnly: faker.datatype.boolean(),
    isPinned: faker.datatype.boolean(),
    lastVisited: faker.number.int(),
    name: faker.string.alphanumeric(),
  })
}
