import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent } from '../../primitives/card/card'
import { Stat } from './stat'

/** A muted label above a large value, for a headline number such as an account's total value. */
const meta = {
  title: 'Safe UI/Stat',
  component: Stat,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="bg-muted p-6 min-h-[200px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Stat>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: 'Total value', value: '$123,456.01' },
}

/** `loading` swaps the value for a skeleton of the same height. */
export const Loading: Story = {
  args: { label: 'Total value', value: '$123,456.01', loading: true },
}

/** Inside a card, as on a dashboard header. */
export const InCard: Story = {
  args: { label: 'Pending transactions', value: '12' },
  decorators: [
    (Story) => (
      <Card className="w-[320px]">
        {/* eslint-disable-next-line no-restricted-syntax -- story-only: top padding since this preview Card has no CardHeader */}
        <CardContent className="pt-6">
          <Story />
        </CardContent>
      </Card>
    ),
  ],
}
