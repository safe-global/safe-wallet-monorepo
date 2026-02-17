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
  decorators: [withMockProvider()],
}

export default meta
type Story = StoryObj<typeof meta>

const mockSpace: GetSpaceResponse = {
  id: 1,
  name: 'Space Name',
  status: 'ACTIVE',
  members: [
    {
      id: 1,
      name: 'Admin User',
      invitedBy: 'system',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      user: {
        id: 1,
        status: 'ACTIVE',
      },
      role: MemberRole.ADMIN,
      status: MemberStatus.ACTIVE,
    },
    {
      id: 2,
      name: 'Member One',
      invitedBy: 'admin@example.com',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      user: {
        id: 2,
        status: 'ACTIVE',
      },
      role: MemberRole.MEMBER,
      status: MemberStatus.ACTIVE,
    },
    {
      id: 3,
      name: 'Member Two',
      invitedBy: 'admin@example.com',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
      user: {
        id: 3,
        status: 'ACTIVE',
      },
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
