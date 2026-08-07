import type { Meta, StoryObj } from '@storybook/react'
import StakingPromoBanner from './index'
import { withMockProvider } from '@/storybook/preview'
import { RouterDecorator } from '@/stories/routerDecorator'

const meta = {
  title: 'Features/Stake/StakingPromoBanner',
  component: StakingPromoBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    visualTest: { disable: true },
  },
  decorators: [
    withMockProvider(),
    (Story) => (
      <RouterDecorator router={{ query: { safe: 'eth:0x0000000000000000000000000000000000000001' } }}>
        <Story />
      </RouterDecorator>
    ),
  ],
} satisfies Meta<typeof StakingPromoBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onDismiss: () => {},
  },
}
