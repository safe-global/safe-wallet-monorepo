import type { Meta, StoryObj } from '@storybook/react'
import TxDateLabel from './index'

const meta: Meta<typeof TxDateLabel> = {
  title: 'Components/Base/TxDateLabel',
  component: TxDateLabel,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-sm p-4">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { item: { type: 'DATE_LABEL', timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 } },
}
