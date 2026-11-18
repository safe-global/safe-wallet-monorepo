import type { Meta, StoryObj } from '@storybook/react'
import { Avatar, AvatarFallback } from '../../primitives/avatar/avatar'
import { Card } from '../../primitives/card/card'
import { Typography } from '../../primitives/typography/typography'
import { ExpandableCard } from './expandable-card'

const RECIPIENTS = [
  { initials: 'TR', name: 'Treasury', address: '0x8675…bca19b' },
  { initials: 'PA', name: 'Payroll', address: '0x5afe…c0ffee' },
  { initials: 'OP', name: 'Operations', address: '0x1234…abcd01' },
]

/** A muted summary card that toggles a list of details below it. */
const meta = {
  title: 'Safe UI/ExpandableCard',
  component: ExpandableCard,
  args: { summary: 'Recipients', detailsLabel: 'recipient details', children: null },
  decorators: [
    (Story) => (
      <div className="max-w-[420px] p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ExpandableCard>

export default meta
type Story = StoryObj<typeof meta>

/** Stacked avatars and a count as the summary, one card per recipient as the details. */
export const Default: Story = {
  render: () => (
    <ExpandableCard
      detailsLabel="recipient details"
      summary={
        <>
          <span className="flex shrink-0 -space-x-2">
            {RECIPIENTS.map((recipient) => (
              <Avatar key={recipient.name} size="xs" className="ring-2 ring-muted">
                <AvatarFallback>{recipient.initials}</AvatarFallback>
              </Avatar>
            ))}
          </span>
          <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
            3 recipients
          </Typography>
        </>
      }
    >
      {RECIPIENTS.map((recipient) => (
        <Card key={recipient.name} variant="muted" size="sm">
          <Typography variant="paragraph-small-medium">{recipient.name}</Typography>
          <Typography variant="paragraph-mini" color="muted">
            {recipient.address}
          </Typography>
        </Card>
      ))}
    </ExpandableCard>
  ),
}

/** `defaultOpen` shows the details on first render. */
export const Open: Story = {
  render: () => (
    <ExpandableCard
      defaultOpen
      detailsLabel="token details"
      summary={
        <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
          2 tokens
        </Typography>
      }
    >
      <Typography variant="paragraph-small">Ether · up to 5 ETH a day</Typography>
      <Typography variant="paragraph-small">USD Coin · up to 10,000 USDC a month</Typography>
    </ExpandableCard>
  ),
}
