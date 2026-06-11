import type { Meta, StoryObj } from '@storybook/react'
import LaunchScreenView from './LaunchScreenView'

const meta = {
  component: LaunchScreenView,
  title: 'common/LaunchScreen',
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LaunchScreenView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { progress: 65, caption: 'Fetching your accounts…' },
}

export const Start: Story = {
  args: { progress: 30, caption: 'Loading your workspace…' },
}

export const Finishing: Story = {
  args: { progress: 90, caption: 'Almost there…' },
}
