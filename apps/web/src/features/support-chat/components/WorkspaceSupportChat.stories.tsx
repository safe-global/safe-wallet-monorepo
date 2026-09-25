import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import WorkspaceSupportChat from './WorkspaceSupportChat'

const setup = createMockStory({})
const meta = {
  title: 'Features/SupportChat/WorkspaceSupportChat',
  component: WorkspaceSupportChat,
  args: { open: true, onClose: () => undefined },
  loaders: [mswLoader],
  parameters: setup.parameters,
  decorators: [setup.decorator],
} satisfies Meta<typeof WorkspaceSupportChat>

export default meta
type Story = StoryObj<typeof meta>
export const SignedOut: Story = {}
