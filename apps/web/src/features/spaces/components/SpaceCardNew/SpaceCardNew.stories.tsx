import type { Meta, StoryObj } from '@storybook/react'
import SpaceCardNew from './index'
import { MemberRole, MemberStatus } from '@/features/spaces/hooks/useSpaceMembers'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { withMockProvider } from '@/storybook/preview'

const meta: Meta<typeof SpaceCardNew> = {
  component: SpaceCardNew,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [withMockProvider({ shadcn: true })],
}

export default meta
type Story = StoryObj<typeof meta>

const mockSpace: GetSpaceResponse = {
  id: 1,
  name: 'Space Name',
  safeCount: 5,
  members: [
    {
      name: 'Admin User',
      invitedBy: 'system',
      user: { id: 1 },
      role: MemberRole.ADMIN,
      status: MemberStatus.ACTIVE,
    },
    {
      name: 'Member One',
      invitedBy: 'admin@example.com',
      user: { id: 2 },
      role: MemberRole.MEMBER,
      status: MemberStatus.ACTIVE,
    },
    {
      name: 'Member Two',
      invitedBy: 'admin@example.com',
      user: { id: 3 },
      role: MemberRole.MEMBER,
      status: MemberStatus.ACTIVE,
    },
  ],
}

export const Default: Story = {
  args: {
    space: mockSpace,
  },
}
