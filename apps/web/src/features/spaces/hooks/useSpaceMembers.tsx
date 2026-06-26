import {
  useMembersGetMembershipV1Query,
  useMembersGetUsersV1Query,
  type MemberDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAuthGetMeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'

// A revoked membership makes the members endpoint return 403, a deleted space 404. Both mean the
// caller no longer has access. Transient errors (5xx/network) are excluded so a blip doesn't drop access.
const isMembershipRevoked = (error: FetchBaseQueryError | SerializedError | undefined): boolean =>
  !!error && 'status' in error && (error.status === 403 || error.status === 404)

export enum MemberStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  DECLINED = 'DECLINED',
}

export enum MemberRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export const isAdmin = (member: MemberDto) => member.role === MemberRole.ADMIN

export const isActiveAdmin = (member: MemberDto) => isAdmin(member) && member.status === MemberStatus.ACTIVE

export const isInviteExpired = (member: MemberDto): boolean => {
  if (member.status !== MemberStatus.INVITED || member.inviteExpiresAt == null) return false

  // Guard NaN explicitly so a malformed date isn't silently treated as not-expired
  const expiresAt = new Date(member.inviteExpiresAt).getTime()
  return Number.isFinite(expiresAt) && expiresAt <= Date.now()
}

export const getMemberDisplayName = (member: Pick<MemberDto, 'name' | 'alias'>) => member.alias || member.name

const useAllMembers = (spaceId?: string) => {
  const currentSpaceId = useCurrentSpaceId()
  const actualSpaceId = spaceId ?? currentSpaceId
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { data, error } = useMembersGetUsersV1Query(
    { spaceId: actualSpaceId ?? '' },
    { skip: !isUserSignedIn || !actualSpaceId, ...SPACE_REFRESH_OPTIONS },
  )
  // RTK keeps the last successful `data` on a failed refetch. When our membership is revoked in
  // another session the refetch 403s, so drop access instead of returning the stale member list.
  if (isMembershipRevoked(error)) return []
  return data?.members || []
}

export const useSpaceMembersByStatus = () => {
  const allMembers = useAllMembers()

  const invitedMembers = allMembers.filter(
    (member) => member.status === MemberStatus.INVITED || member.status === MemberStatus.DECLINED,
  )
  const activeMembers = allMembers.filter((member) => member.status === MemberStatus.ACTIVE)

  return { activeMembers, invitedMembers }
}

export const useCurrentMembership = (spaceId?: string) => {
  const allMembers = useAllMembers(spaceId)
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  return allMembers.find((member) => member.user.id === user?.id)
}

export const useCurrentMemberProfile = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)

  const { data: session, isLoading: isSessionLoading } = useAuthGetMeV1Query(undefined, {
    skip: !isUserSignedIn,
  })
  const { currentData: membership, isLoading: isMembershipLoading } = useMembersGetMembershipV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId },
  )

  return {
    membership,
    signerAddress: session?.authMethod === 'siwe' ? session.signerAddress : undefined,
    email: session?.authMethod === 'oidc' ? (session.email ?? membership?.user.email ?? undefined) : undefined,
    isLoading: isSessionLoading || isMembershipLoading,
  }
}

export const useIsActiveMember = (spaceId?: string) => {
  const currentMembership = useCurrentMembership(spaceId)
  return !!currentMembership && currentMembership.status === MemberStatus.ACTIVE
}

export const useIsAdmin = (spaceId?: string) => {
  const currentMembership = useCurrentMembership(spaceId)
  return !!currentMembership && isActiveAdmin(currentMembership)
}

export const useIsInvited = () => {
  const currentMembership = useCurrentMembership()
  return currentMembership?.status === MemberStatus.INVITED
}
