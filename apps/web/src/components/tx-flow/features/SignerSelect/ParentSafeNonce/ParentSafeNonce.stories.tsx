import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { safeFixtures } from '@safe-global/test/msw/fixtures'
import { createMockStory } from '@/stories/mocks'
import {
  multisigExecutionInfoBuilder,
  multisigTransactionBuilder,
  queuedTransactionItem,
} from '@/tests/builders/queuedTransaction'
import ParentSafeNonce from './index'

const parentSafeAddress = safeFixtures.efSafe.owners[1].value

const parentSafeHandlers = [
  http.get(new RegExp(`/v1/chains/\\d+/safes/${parentSafeAddress}/nonces$`), () =>
    HttpResponse.json({ currentNonce: 51, recommendedNonce: 53 }),
  ),
  http.get(new RegExp(`/v1/chains/\\d+/safes/${parentSafeAddress}/transactions/queued`), () =>
    HttpResponse.json({
      next: null,
      previous: null,
      results: [51, 52].map((nonce) =>
        queuedTransactionItem(
          multisigTransactionBuilder()
            .with({ executionInfo: multisigExecutionInfoBuilder().with({ nonce }).build() })
            .build(),
        ),
      ),
    }),
  ),
]

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner' })

const meta = {
  title: 'Components/TxFlow/ParentSafeNonce',
  component: ParentSafeNonce,
  parameters: {
    layout: 'centered',
    ...setup.parameters,
    msw: { handlers: [...parentSafeHandlers, ...setup.handlers] },
  },
  decorators: [setup.decorator],
  args: { parentSafeAddress },
} satisfies Meta<typeof ParentSafeNonce>

export default meta
type Story = StoryObj<typeof meta>

export const WithQueuedTransactions: Story = {}
