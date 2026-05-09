import type { Meta, StoryObj } from '@storybook/react'
import { StakeBanner } from './StakeBanner'
import { RouterDecorator } from '@/stories/routerDecorator'

const meta = {
  title: 'Components/Dashboard/Banners/StakeBanner',
  component: StakeBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    visualTest: { disable: true },
  },
  decorators: [
    (Story) => (
      <RouterDecorator router={{ query: { safe: 'eth:0x0000000000000000000000000000000000000001' } }}>
        <Story />
      </RouterDecorator>
    ),
  ],
} satisfies Meta<typeof StakeBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onDismiss: () => {},
  },
}
