import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import LaunchScreen from './index'

const meta = {
  title: 'Components/LaunchScreen',
  component: LaunchScreen,
  parameters: {
    layout: 'fullscreen',
    // Animated, time-driven splash — a pixel snapshot would flake on the logo pulse / caption steps.
    visualTest: { disable: true },
  },
  decorators: [withMockProvider({ shadcn: true })],
} satisfies Meta<typeof LaunchScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
