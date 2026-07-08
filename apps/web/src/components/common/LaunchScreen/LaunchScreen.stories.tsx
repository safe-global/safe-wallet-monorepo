import type { Meta, StoryObj } from '@storybook/react'
import { http } from 'msw'
import { withMockProvider } from '@/storybook/preview'
import LaunchScreen from './index'

const meta = {
  title: 'Components/LaunchScreen',
  component: LaunchScreen,
  parameters: {
    layout: 'fullscreen',
    // Animated, time-driven splash — a pixel snapshot would flake on the logo pulse / caption steps.
    visualTest: { disable: true },
    msw: {
      // The splash unmounts ~1s after the chains query settles, leaving the story blank.
      // Keep the query pending forever so the splash stays up for review.
      handlers: [http.get(/\/v2\/chains/, () => new Promise<never>(() => {}))],
    },
  },
  decorators: [withMockProvider({ shadcn: true })],
} satisfies Meta<typeof LaunchScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
