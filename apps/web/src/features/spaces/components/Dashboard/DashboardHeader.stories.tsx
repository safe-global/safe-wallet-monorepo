import type { Meta, StoryObj } from '@storybook/react'
import { DashboardHeader } from './DashboardHeader'

const meta = {
  title: 'Features/Spaces/DashboardHeader',
  component: DashboardHeader,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="bg-muted p-6 min-w-[1000px] min-h-[200px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DashboardHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: '$123,456.01',
    onSend: () => {},
    onReceive: () => {},
    onSwap: () => {},
    onBuildTransaction: () => {},
    onCustomize: () => {},
  },
}
