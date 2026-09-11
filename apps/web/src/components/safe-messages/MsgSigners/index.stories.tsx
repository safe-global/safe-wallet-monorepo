import type { Meta, StoryObj } from '@storybook/react'
import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import MsgSigners from './index'

const OWNERS = ['0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222']

const message = (overrides: Partial<MessageItem> = {}): MessageItem => ({
  type: 'MESSAGE',
  messageHash: '0xee41920151304f4b3815e67a5343b3c206e7bf9e3eb5147309fc485927f2594e',
  status: 'NEEDS_CONFIRMATION',
  logoUri: null,
  name: null,
  message: 'Message text',
  creationTimestamp: 1700000000000,
  modifiedTimestamp: 1700000000000,
  confirmationsSubmitted: 1,
  confirmationsRequired: 3,
  proposedBy: { value: OWNERS[0] },
  confirmations: [{ owner: { value: OWNERS[0] }, signature: '' }],
  ...overrides,
})

const meta = {
  title: 'Components/SafeMessages/MsgSigners',
  component: MsgSigners,
  parameters: {
    componentSubtitle: 'Signer stepper for a message. The connector line must run behind the icons, not through them.',
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <RouterDecorator>
          {/* The off-chain message flow renders this inside an InfoBox with this fill, which the
              icon backgrounds have to match to punch the connector line out. */}
          <div className="w-[30rem] rounded-lg bg-[var(--color-info-background)] p-4">
            <Story />
          </div>
        </RouterDecorator>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof MsgSigners>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The "Collect all the confirmations" block from the off-chain message flow: one signature in, two
 * still pending. This is the case that showed the connector line striking through every icon.
 */
export const CollectingConfirmations: Story = {
  args: {
    msg: message(),
    showOnlyConfirmations: true,
    showMissingSignatures: true,
    backgroundColor: 'var(--color-info-background)',
  },
}

/** Fully signed, so no skeleton rows and the line spans only real confirmations. */
export const FullySigned: Story = {
  args: {
    msg: message({
      status: 'CONFIRMED',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
      confirmations: OWNERS.map((value) => ({ owner: { value }, signature: '' })),
    }),
    showOnlyConfirmations: true,
    backgroundColor: 'var(--color-info-background)',
  },
}

/** Message-details variant: includes the "Created" row, which has no icon background of its own. */
export const WithCreatedRow: Story = {
  args: {
    msg: message(),
    backgroundColor: 'var(--color-info-background)',
  },
}
