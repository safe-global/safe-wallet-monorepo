import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import { createMockSpace, mockUser } from '@/stories/mocks/handlers'
import Spaces from '@/pages/welcome/spaces'

/**
 * Spaces List page - displays user's Spaces.
 * Shows collaborative spaces the user belongs to.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  features: { spaces: true },
  shadcn: true,
})

const noInvitationNoSpaceSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  features: { spaces: true },
  shadcn: true,
  handlers: [http.get(/\/v1\/spaces$/, () => HttpResponse.json([]))],
})

const invitedMember = {
  role: 'MEMBER' as const,
  name: 'Tanya',
  invitedBy: '0x1234567890123456789012345678901234567890',
  status: 'INVITED' as const,
  user: { id: mockUser.id },
}

const activeMember = {
  role: 'ADMIN' as const,
  name: 'Admin User',
  invitedBy: 'system',
  status: 'ACTIVE' as const,
  user: { id: 2 },
}

const createInvitedSpace = (id: number, name: string, safeCount: number) => ({
  ...createMockSpace(id),
  id,
  name,
  safeCount,
  members: [invitedMember, activeMember],
})

const createInvitationsSetup = (spaces: ReturnType<typeof createInvitedSpace>[]) => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'connected',
    features: { spaces: true },
    shadcn: true,
  })

  return {
    ...setup,
    parameters: {
      ...setup.parameters,
      msw: {
        // Specific Spaces handlers must run before the default story handlers.
        handlers: [
          http.get(/\/v1\/spaces$/, () => HttpResponse.json(spaces)),
          http.get(/\/v1\/spaces\/\d+$/, () => HttpResponse.json(spaces[0])),
          ...setup.handlers,
        ],
      },
    },
  }
}

const oneInvitationNoSpaceSetup = createInvitationsSetup([createInvitedSpace(1, 'Acme Inc.', 13)])

const oneInvitationOneSpaceSetup = createInvitationsSetup([
  createInvitedSpace(1, 'Acme Inc.', 13),
  {
    ...createMockSpace(2),
    id: 2,
    name: 'My Space',
    safeCount: 2,
  },
])

const threeInvitationsSetup = createInvitationsSetup([
  createInvitedSpace(1, 'Acme Inc.', 13),
  createInvitedSpace(2, 'Optimism', 13),
  createInvitedSpace(3, 'My Space', 13),
])

const meta = {
  title: 'Pages/Onboarding/SpacesList',
  component: Spaces,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Spaces>

export default meta
type Story = StoryObj<typeof meta>

export const NoInvitations: Story = {
  parameters: defaultSetup.parameters,
  decorators: [defaultSetup.decorator],
}

export const NoInvitationNoSpace: Story = {
  parameters: noInvitationNoSpaceSetup.parameters,
  decorators: [noInvitationNoSpaceSetup.decorator],
}

export const OneInvitationNoSpace: Story = {
  parameters: oneInvitationNoSpaceSetup.parameters,
  decorators: [oneInvitationNoSpaceSetup.decorator],
}

export const OneInvitationOneSpace: Story = {
  parameters: oneInvitationOneSpaceSetup.parameters,
  decorators: [oneInvitationOneSpaceSetup.decorator],
}

export const ThreeInvitations: Story = {
  parameters: threeInvitationsSetup.parameters,
  decorators: [threeInvitationsSetup.decorator],
}
