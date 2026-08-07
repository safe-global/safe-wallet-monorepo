import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import AddMemberModal from '.'
import { createMockStory } from '@/stories/mocks'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/spaces/members',
  query: { spaceId: '1' },
  shadcn: true,
})

const meta = {
  title: 'Features/Spaces/AddMemberModal',
  component: AddMemberModal,
  loaders: [mswLoader],
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'centered',
    ...defaultSetup.parameters,
  },
  args: {
    onClose: () => {},
  },
} satisfies Meta<typeof AddMemberModal>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
