import type { Meta, StoryObj } from '@storybook/react'
import NativeSwapsCard from './index'

const meta = {
  title: 'Components/SafeApps/NativeSwapsCard',
  component: NativeSwapsCard,
  parameters: {
    componentSubtitle: 'Renders a promo card for native swaps',
  },

  decorators: [
    (Story) => (
      <div className="max-w-[500px]">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof NativeSwapsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onDismiss: () => {},
  },
}
