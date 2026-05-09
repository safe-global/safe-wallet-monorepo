import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import SpaceMembers from '@/pages/spaces/members'

/**
 * Space Members page - manage Space membership.
 * View and manage members of a Space.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  layout: 'fullPage',
  pathname: '/spaces/members',
  features: { spaces: true },
  query: { spaceId: '1' },
})

const meta = {
  title: 'Pages/Spaces/Members',
  component: SpaceMembers,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof SpaceMembers>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
