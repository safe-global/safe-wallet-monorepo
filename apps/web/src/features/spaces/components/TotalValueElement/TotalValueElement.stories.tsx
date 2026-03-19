import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent } from '@/components/ui/card'
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
