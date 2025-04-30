import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { Builder, type IBuilder } from '@/tests/Builder'
import { faker } from '@faker-js/faker'

export function safeMsgBuilder(): IBuilder<MessageItem> {
  return Builder.new<MessageItem>().with({
    type: 'MESSAGE',
    messageHash: faker.string.hexadecimal(),
    status: 'NEEDS_CONFIRMATION',
    logoUri: null,
    name: null,
    message: 'Message text',
    creationTimestamp: faker.date.past().getTime(),
    modifiedTimestamp: faker.date.past().getTime(),
    confirmationsSubmitted: 1,
    confirmationsRequired: 2,
    proposedBy: { value: faker.finance.ethereumAddress() },
    confirmations: [
      {
        owner: { value: faker.finance.ethereumAddress() },
        signature: '',
      },
    ],
  })
}
