import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import DangerZoneSection from '../sections/DangerZoneSection'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin, useIsActiveMember } from '../../../public/hooks/useSpaceMembers'
import { useIsLastActiveAdmin } from '../../../hooks/useIsLastActiveAdmin'
import { useSpaceDeletionGuard } from '../../../hooks/billing/useSpaceDeletionGuard'
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const MOCK_SPACE_UUID_ALT = '22222222-2222-2222-2222-222222222222'

jest.mock('../../../public/hooks/useSpaceMembers', () => ({
  get MemberStatus() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').MemberStatus
  },
  get MEMBER_ALIAS_MAX_LENGTH() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').MEMBER_ALIAS_MAX_LENGTH
  },
  get getMemberDisplayName() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').getMemberDisplayName
  },
  get sanitizeMemberAlias() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').sanitizeMemberAlias
  },
  get isAdmin() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').isAdmin
  },
  get isActiveAdmin() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').isActiveAdmin
  },
  get isInviteExpired() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').isInviteExpired
  },
  get useSpaceMembersByStatus() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useSpaceMembersByStatus
  },
  get useCurrentMembership() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useCurrentMembership
  },
  get useCurrentMemberProfile() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useCurrentMemberProfile
  },
  get useIsInvited() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useIsInvited
  },
  useIsAdmin: jest.fn(() => false),
  useIsActiveMember: jest.fn(() => false),
}))
jest.mock('../../../hooks/useIsLastActiveAdmin', () => ({
  ...jest.requireActual('../../../hooks/useIsLastActiveAdmin'),
  useIsLastActiveAdmin: jest.fn(() => false),
}))
jest.mock('../../../hooks/billing/useSpaceDeletionGuard', () => ({
  ...jest.requireActual('../../../hooks/billing/useSpaceDeletionGuard'),
  useSpaceDeletionGuard: jest.fn(() => ({ isDeletionBlocked: false })),
}))

jest.mock('../DeleteSpaceDialog', () => () => null)
jest.mock('../LeaveSpaceDialog', () => () => null)

const renderSection = (space: GetSpaceResponse | undefined) =>
  render(
    <Provider store={makeStore()}>
      <DangerZoneSection space={space} />
    </Provider>,
  )

describe('DangerZoneSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes the viewed space id to useIsAdmin and useIsActiveMember', () => {
    const space: GetSpaceResponse = {
      uuid: MOCK_SPACE_UUID,
      name: 'Other Workspace',
      members: [],
      memberCount: 0,
      safeCount: 0,
      experimentalFeatures: [],
      setupStatus: null,
    }

    renderSection(space)

    expect(useIsAdmin).toHaveBeenCalledWith(MOCK_SPACE_UUID)
    expect(useIsActiveMember).toHaveBeenCalledWith(MOCK_SPACE_UUID)
  })

  it('passes undefined when the space is not loaded yet', () => {
    renderSection(undefined)

    expect(useIsAdmin).toHaveBeenCalledWith(undefined)
    expect(useIsActiveMember).toHaveBeenCalledWith(undefined)
  })

  it('does not fall back to the last-used space when a different space is viewed', () => {
    const viewedSpace: GetSpaceResponse = {
      uuid: MOCK_SPACE_UUID_ALT,
      name: 'Viewed',
      members: [],
      memberCount: 0,
      safeCount: 0,
      experimentalFeatures: [],
      setupStatus: null,
    }

    renderSection(viewedSpace)

    expect(useIsAdmin).not.toHaveBeenCalledWith(undefined)
    expect(useIsActiveMember).not.toHaveBeenCalledWith(undefined)
    expect(useIsLastActiveAdmin).toHaveBeenCalled()
  })

  describe('Delete Workspace', () => {
    const space: GetSpaceResponse = {
      uuid: MOCK_SPACE_UUID,
      name: 'Acme',
      members: [],
      memberCount: 0,
      safeCount: 0,
      experimentalFeatures: [],
      setupStatus: null,
    }

    beforeEach(() => {
      jest.mocked(useIsAdmin).mockReturnValue(true)
    })

    it('checks the subscription of the viewed space for admins only', () => {
      renderSection(space)
      expect(useSpaceDeletionGuard).toHaveBeenCalledWith(MOCK_SPACE_UUID)

      jest.mocked(useIsAdmin).mockReturnValue(false)
      renderSection(space)
      expect(useSpaceDeletionGuard).toHaveBeenLastCalledWith(null)
    })

    it('enables deletion when nothing blocks it', () => {
      renderSection(space)

      expect(screen.getByTestId('space-delete-button')).toBeEnabled()
    })

    it('disables deletion and explains why while a subscription is still live', async () => {
      jest.mocked(useSpaceDeletionGuard).mockReturnValue({
        isDeletionBlocked: true,
        blockedReason: 'Cancel the subscription before deleting this Workspace.',
      })
      renderSection(space)

      expect(screen.getByTestId('space-delete-button')).toBeDisabled()

      await userEvent.hover(screen.getByTestId('space-delete-button').parentElement as HTMLElement)

      expect(await screen.findByText('Cancel the subscription before deleting this Workspace.')).toBeInTheDocument()
    })

    it('keeps deletion disabled without a tooltip while the subscription is loading', () => {
      jest.mocked(useSpaceDeletionGuard).mockReturnValue({ isDeletionBlocked: true })
      renderSection(space)

      expect(screen.getByTestId('space-delete-button')).toBeDisabled()
    })
  })
})
