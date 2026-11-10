import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { TotalValueElement } from './TotalValueElement'

const meta = {
  title: 'Features/Spaces/TotalValueElement',
  component: TotalValueElement,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="bg-muted p-6 min-h-[200px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TotalValueElement>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: '$123,456.01',
  },
}

export const InCard: Story = {
  decorators: [
    (Story) => (
      <Card className="w-[320px]">
        {/* eslint-disable-next-line no-restricted-syntax -- story-only: pt-6 adds top padding since this preview Card has no CardHeader */}
        <CardContent className="pt-6">
          <Story />
        </CardContent>
      </Card>
    ),
  ],
  args: {
    value: '$123,456.01',
  },
}

export const LargeValue: Story = {
  args: {
    value: '$1,278,243,618.88',
  },
}

export const LargeValueInNarrowCard: Story = {
  decorators: InCard.decorators,
  args: {
    value: '$1,278,243,618.88',
  },
}

export const HugeValueInNarrowCard: Story = {
  decorators: InCard.decorators,
  args: {
    value: '$12,345,678,901,234.56',
  },
}
