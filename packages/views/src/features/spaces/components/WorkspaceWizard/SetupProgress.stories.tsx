import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import SetupProgress from './SetupProgress'

const meta = {
  title: 'Features/Spaces/WorkspaceWizard/SetupProgress',
  component: SetupProgress,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SetupProgress>

export default meta
type Story = StoryObj<typeof meta>

export const Working: Story = {
  args: {
    isWorking: true,
    title: 'Setting up your Workspace',
    body: 'This usually takes a few seconds.',
  },
}

export const Failed: Story = {
  args: {
    isWorking: false,
    title: "We couldn't load your Workspace setup",
    body: 'Check your connection and try again.',
    actionLabel: 'Try again',
    onAction: fn(),
  },
}
