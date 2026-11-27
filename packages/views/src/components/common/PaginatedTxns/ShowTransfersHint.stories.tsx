import type { Meta, StoryObj } from '@storybook/react'
import ShowTransfersHint from './ShowTransfersHint'

const meta: Meta<typeof ShowTransfersHint> = {
  title: 'Components/Common/PaginatedTxns/ShowTransfersHint',
  component: ShowTransfersHint,
  parameters: { layout: 'centered' },
  args: { onShowTransfers: () => {} },
  decorators: [
    (Story) => (
      <div className="min-w-[400px] rounded-lg bg-card p-8">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
