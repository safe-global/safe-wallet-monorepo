import type { Meta, StoryObj } from '@storybook/react'
import { QueueProposerMark, QueueWarningMarker } from './QueueRowMarks'

const meta = {
  title: 'Features/Spaces/Transactions/QueueRowMarks',
  component: QueueProposerMark,
  parameters: { layout: 'centered' },
  args: { threshold: 2, defaultOpen: true },
} satisfies Meta<typeof QueueProposerMark>

export default meta
type Story = StoryObj<typeof meta>

export const ProposerMark: Story = {}

export const WarningMarker: Story = {
  render: () => <QueueWarningMarker warnings={['Order expired', 'Changes who controls funds']} defaultOpen />,
}
