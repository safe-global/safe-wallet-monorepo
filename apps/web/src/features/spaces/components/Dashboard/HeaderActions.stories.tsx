import type { Meta, StoryObj } from '@storybook/react'
import { HeaderActions } from './HeaderActions'

const meta = {
  title: 'Features/Spaces/HeaderActions',
  component: HeaderActions,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="bg-muted p-6 min-w-[1000px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HeaderActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSend: () => {},
    onReceive: () => {},
    onSwap: () => {},
    onBuildTransaction: () => {},
    onCustomize: () => {},
  },
}
