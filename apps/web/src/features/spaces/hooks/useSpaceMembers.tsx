import {
  useMembersGetMembershipV1Query,
  useMembersGetUsersV1Query,
  type MemberDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAuthGetMeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'

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

const useAllMembers = (spaceId?: number) => {
  const currentSpaceId = useCurrentSpaceId()
  const actualSpaceId = spaceId ?? currentSpaceId
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { data: currentData } = useMembersGetUsersV1Query(
    { spaceId: Number(actualSpaceId) },
    { skip: !isUserSignedIn || !actualSpaceId },
  )
  return currentData?.members || []
}

export const useSpaceMembersByStatus = () => {
  const allMembers = useAllMembers()

  const invitedMembers = allMembers.filter(
    (member) => member.status === MemberStatus.INVITED || member.status === MemberStatus.DECLINED,
  )
  const activeMembers = allMembers.filter((member) => member.status === MemberStatus.ACTIVE)

  return { activeMembers, invitedMembers }
}

export const useCurrentMembership = (spaceId?: number) => {
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
    { spaceId: Number(spaceId) },
    { skip: !isUserSignedIn || !spaceId },
  )

  return {
    membership,
    signerAddress: session?.authMethod === 'siwe' ? session.signerAddress : undefined,
    email: session?.authMethod === 'oidc' ? (session.email ?? membership?.user.email ?? undefined) : undefined,
    isLoading: isSessionLoading || isMembershipLoading,
  }
}

export const useIsActiveMember = (spaceId?: number) => {
  const currentMembership = useCurrentMembership(spaceId)
  return !!currentMembership && currentMembership.status === MemberStatus.ACTIVE
}

export const useIsAdmin = (spaceId?: number) => {
  const currentMembership = useCurrentMembership(spaceId)
  return !!currentMembership && isActiveAdmin(currentMembership)
}

export const useIsInvited = () => {
  const currentMembership = useCurrentMembership()
  return currentMembership?.status === MemberStatus.INVITED
}
