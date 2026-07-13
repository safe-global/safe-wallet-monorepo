import { format, isToday, isValid, isYesterday } from 'date-fns'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import type { UserWithWallets } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import type {
  GetSpaceResponse,
  SpaceMemberDto,
  SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { MemberStatus, MemberRole } from './hooks/useSpaceMembers'
import type { AddressBookState } from '@/store/addressBookSlice'

// TODO: Currently also checks for 404 because the /v1/spaces/<orgId> endpoint does not return 401
export const isUnauthorized = (error: FetchBaseQueryError | SerializedError | undefined) => {
  return error && 'status' in error && (error.status === 401 || error.status === 404)
}

export const filterSpacesByStatus = (
  currentUser: UserWithWallets | undefined,
  spaces: GetSpaceResponse[],
  status: MemberStatus,
) => {
  return spaces.filter((space) => {
    return space.members.some((member) => member.user.id === currentUser?.id && member.status === status)
  })
}

export const getInvitedByName = (
  space: GetSpaceResponse | undefined,
  currentUserId: number | undefined,
): string | undefined => space?.members.find((member) => member.user.id === currentUserId)?.invitedByName

export const getNonDeclinedSpaces = (currentUser: UserWithWallets | undefined, spaces: GetSpaceResponse[]) => {
  const pendingInvites = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.INVITED)
  const activeSpaces = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.ACTIVE)

  return [...pendingInvites, ...activeSpaces]
}

export const mapSpaceContactsToAddressBookState = (spaceContacts: SpaceAddressBookItemDto[]): AddressBookState => {
  const addressBooks: AddressBookState = {}

  for (const contact of spaceContacts) {
    for (const chainId of contact.chainIds) {
      if (!addressBooks[chainId]) {
        addressBooks[chainId] = {}
      }

      addressBooks[chainId][contact.address] = contact.name
    }
  }

  return addressBooks
}

/**
 * Check if a user is an active admin of a space based on the members array
 * @param members - Array of members from GetSpaceResponse
 * @param userId - The user ID to check
 */
export const isUserActiveAdmin = (members: SpaceMemberDto[], userId: number | undefined): boolean => {
  if (!userId) return false
  const membership = members.find((member) => member.user.id === userId)
  return !!membership && membership.role === MemberRole.ADMIN && membership.status === MemberStatus.ACTIVE
}

/**
 * Formats an ISO date string as a relative day label with time,
 * e.g. "Today at 9:41 AM", "Yesterday at 9:41 AM" or "Jun 11 at 9:41 AM".
 * Returns an empty string for missing or unparsable input.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (!isValid(date)) return ''

  const timeStr = format(date, 'p')

  if (isToday(date)) {
    return `Today at ${timeStr}`
  }
  if (isYesterday(date)) {
    return `Yesterday at ${timeStr}`
  }
  return `${format(date, 'MMM d')} at ${timeStr}`
}
