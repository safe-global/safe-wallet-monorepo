import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['spaces'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      addressBooksGetAddressBookItemsV1: build.query<
        AddressBooksGetAddressBookItemsV1ApiResponse,
        AddressBooksGetAddressBookItemsV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/address-book` }),
        providesTags: ['spaces'],
      }),
      addressBooksUpsertAddressBookItemsV1: build.mutation<
        AddressBooksUpsertAddressBookItemsV1ApiResponse,
        AddressBooksUpsertAddressBookItemsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/address-book`,
          method: 'PUT',
          body: queryArg.upsertAddressBookItemsDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      addressBooksDeleteByAddressV1: build.mutation<
        AddressBooksDeleteByAddressV1ApiResponse,
        AddressBooksDeleteByAddressV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/address-book/${queryArg.address}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['spaces'],
      }),
      addressBookRequestsGetPendingRequestsV1: build.query<
        AddressBookRequestsGetPendingRequestsV1ApiResponse,
        AddressBookRequestsGetPendingRequestsV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/address-book/requests` }),
        providesTags: ['spaces'],
      }),
      addressBookRequestsCreateRequestV1: build.mutation<
        AddressBookRequestsCreateRequestV1ApiResponse,
        AddressBookRequestsCreateRequestV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/address-book/requests`,
          method: 'POST',
          body: queryArg.createAddressBookRequestDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      addressBookRequestsApproveRequestV1: build.mutation<
        AddressBookRequestsApproveRequestV1ApiResponse,
        AddressBookRequestsApproveRequestV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/address-book/requests/${queryArg.requestId}/approve`,
          method: 'PUT',
        }),
        invalidatesTags: ['spaces'],
      }),
      addressBookRequestsRejectRequestV1: build.mutation<
        AddressBookRequestsRejectRequestV1ApiResponse,
        AddressBookRequestsRejectRequestV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/address-book/requests/${queryArg.requestId}/reject`,
          method: 'PUT',
        }),
        invalidatesTags: ['spaces'],
      }),
      spacesCreateV1: build.mutation<SpacesCreateV1ApiResponse, SpacesCreateV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces`, method: 'POST', body: queryArg.createSpaceDto }),
        invalidatesTags: ['spaces'],
      }),
      spacesGetV1: build.query<SpacesGetV1ApiResponse, SpacesGetV1ApiArg>({
        query: () => ({ url: `/v1/spaces` }),
        providesTags: ['spaces'],
      }),
      spacesGetOneV1: build.query<SpacesGetOneV1ApiResponse, SpacesGetOneV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.id}` }),
        providesTags: ['spaces'],
      }),
      spacesUpdateV1: build.mutation<SpacesUpdateV1ApiResponse, SpacesUpdateV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.id}`, method: 'PATCH', body: queryArg.updateSpaceDto }),
        invalidatesTags: ['spaces'],
      }),
      spacesDeleteV1: build.mutation<SpacesDeleteV1ApiResponse, SpacesDeleteV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.id}`, method: 'DELETE' }),
        invalidatesTags: ['spaces'],
      }),
      spaceAuditGetAuditLogV1: build.query<SpaceAuditGetAuditLogV1ApiResponse, SpaceAuditGetAuditLogV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/audit-log`,
          params: {
            event_type: queryArg.eventType,
            actor_user_id: queryArg.actorUserId,
            created_at__gte: queryArg.createdAtGte,
            created_at__lte: queryArg.createdAtLte,
            sort_direction: queryArg.sortDirection,
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['spaces'],
      }),
      spaceAuditGetAuditLogActorsV1: build.query<
        SpaceAuditGetAuditLogActorsV1ApiResponse,
        SpaceAuditGetAuditLogActorsV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/audit-log/actors` }),
        providesTags: ['spaces'],
      }),
      spaceSafesCreateV1: build.mutation<SpaceSafesCreateV1ApiResponse, SpaceSafesCreateV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/safes`,
          method: 'POST',
          body: queryArg.createSpaceSafesDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      spaceSafesGetV1: build.query<SpaceSafesGetV1ApiResponse, SpaceSafesGetV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/safes` }),
        providesTags: ['spaces'],
      }),
      spaceSafesDeleteV1: build.mutation<SpaceSafesDeleteV1ApiResponse, SpaceSafesDeleteV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/safes`,
          method: 'DELETE',
          body: queryArg.deleteSpaceSafesDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      membersInviteUserV1: build.mutation<MembersInviteUserV1ApiResponse, MembersInviteUserV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/members/invite`,
          method: 'POST',
          body: queryArg.inviteUsersDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      membersAcceptInviteV1: build.mutation<MembersAcceptInviteV1ApiResponse, MembersAcceptInviteV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/members/accept`,
          method: 'POST',
          body: queryArg.acceptInviteDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      membersDeclineInviteV1: build.mutation<MembersDeclineInviteV1ApiResponse, MembersDeclineInviteV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/members/decline`, method: 'POST' }),
        invalidatesTags: ['spaces'],
      }),
      membersRenewInviteV1: build.mutation<MembersRenewInviteV1ApiResponse, MembersRenewInviteV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/members/${queryArg.userId}/invite/renew`,
          method: 'POST',
        }),
        invalidatesTags: ['spaces'],
      }),
      membersGetUsersV1: build.query<MembersGetUsersV1ApiResponse, MembersGetUsersV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/members` }),
        providesTags: ['spaces'],
      }),
      membersSelfRemoveV1: build.mutation<MembersSelfRemoveV1ApiResponse, MembersSelfRemoveV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/members`, method: 'DELETE' }),
        invalidatesTags: ['spaces'],
      }),
      membersGetMembershipV1: build.query<MembersGetMembershipV1ApiResponse, MembersGetMembershipV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/membership` }),
        providesTags: ['spaces'],
      }),
      membersUpdateRoleV1: build.mutation<MembersUpdateRoleV1ApiResponse, MembersUpdateRoleV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/members/${queryArg.userId}/role`,
          method: 'PATCH',
          body: queryArg.updateRoleDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      membersUpdateAliasV1: build.mutation<MembersUpdateAliasV1ApiResponse, MembersUpdateAliasV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/members/alias`,
          method: 'PATCH',
          body: queryArg.updateMemberAliasDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      membersRemoveUserV1: build.mutation<MembersRemoveUserV1ApiResponse, MembersRemoveUserV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/members/${queryArg.userId}`, method: 'DELETE' }),
        invalidatesTags: ['spaces'],
      }),
      spaceCounterfactualSafesGetV1: build.query<
        SpaceCounterfactualSafesGetV1ApiResponse,
        SpaceCounterfactualSafesGetV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/counterfactual-safes` }),
        providesTags: ['spaces'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type AddressBooksGetAddressBookItemsV1ApiResponse =
  /** status 200 Address book items retrieved successfully */ SpaceAddressBookDto
export type AddressBooksGetAddressBookItemsV1ApiArg = {
  /** Space UUID to get address book for */
  spaceId: string
}
export type AddressBooksUpsertAddressBookItemsV1ApiResponse =
  /** status 200 Address book updated successfully */ SpaceAddressBookDto
export type AddressBooksUpsertAddressBookItemsV1ApiArg = {
  /** Space UUID to update address book for */
  spaceId: string
  /** Address book items to create or update, including addresses and their labels */
  upsertAddressBookItemsDto: UpsertAddressBookItemsDto
}
export type AddressBooksDeleteByAddressV1ApiResponse = unknown
export type AddressBooksDeleteByAddressV1ApiArg = {
  /** Space UUID containing the address book */
  spaceId: string
  /** Address to remove from the address book (0x prefixed hex string) */
  address: string
}
export type AddressBookRequestsGetPendingRequestsV1ApiResponse =
  /** status 200 Pending requests retrieved successfully */ AddressBookRequestsDto
export type AddressBookRequestsGetPendingRequestsV1ApiArg = {
  /** Space UUID */
  spaceId: string
}
export type AddressBookRequestsCreateRequestV1ApiResponse =
  /** status 201 Request created successfully */ AddressBookRequestItemDto
export type AddressBookRequestsCreateRequestV1ApiArg = {
  /** Space UUID */
  spaceId: string
  /** The contact to propose for the space address book */
  createAddressBookRequestDto: CreateAddressBookRequestDto
}
export type AddressBookRequestsApproveRequestV1ApiResponse = unknown
export type AddressBookRequestsApproveRequestV1ApiArg = {
  /** Space UUID */
  spaceId: string
  /** Request ID to approve */
  requestId: number
}
export type AddressBookRequestsRejectRequestV1ApiResponse = unknown
export type AddressBookRequestsRejectRequestV1ApiArg = {
  /** Space UUID */
  spaceId: string
  /** Request ID to reject */
  requestId: number
}
export type SpacesCreateV1ApiResponse = /** status 200 Space created successfully */ CreateSpaceResponse
export type SpacesCreateV1ApiArg = {
  /** Space creation data including the name of the space */
  createSpaceDto: CreateSpaceDto
}
export type SpacesGetV1ApiResponse = /** status 200 User spaces retrieved successfully */ GetSpaceResponse[]
export type SpacesGetV1ApiArg = void
export type SpacesGetOneV1ApiResponse = /** status 200 Space information retrieved successfully */ GetSpaceResponse
export type SpacesGetOneV1ApiArg = {
  /** Space UUID */
  id: string
}
export type SpacesUpdateV1ApiResponse = /** status 200 Space updated successfully */ UpdateSpaceResponse
export type SpacesUpdateV1ApiArg = {
  /** Space UUID to update */
  id: string
  /** Space update data including new name or other properties */
  updateSpaceDto: UpdateSpaceDto
}
export type SpacesDeleteV1ApiResponse = unknown
export type SpacesDeleteV1ApiArg = {
  /** Space UUID to delete */
  id: string
}
export type SpaceAuditGetAuditLogV1ApiResponse = /** status 200 Paginated audit log entries */ SpaceAuditLogPage
export type SpaceAuditGetAuditLogV1ApiArg = {
  /** Space UUID */
  spaceId: string
  /** Comma-separated list of event types to filter by */
  eventType?: string
  /** Filter by acting user id */
  actorUserId?: number
  /** ISO 8601 lower bound (inclusive) on event creation time */
  createdAtGte?: string
  /** ISO 8601 upper bound (inclusive) on event creation time */
  createdAtLte?: string
  /** Sort direction over (created_at, id). Defaults to desc. */
  sortDirection?: 'asc' | 'desc'
  /** Pagination cursor for retrieving the next set of results */
  cursor?: string
}
export type SpaceAuditGetAuditLogActorsV1ApiResponse =
  /** status 200 Distinct audit log actors */ SpaceAuditLogActorDto[]
export type SpaceAuditGetAuditLogActorsV1ApiArg = {
  /** Space UUID */
  spaceId: string
}
export type SpaceSafesCreateV1ApiResponse = unknown
export type SpaceSafesCreateV1ApiArg = {
  /** Space UUID to add Safes to */
  spaceId: string
  /** List of Safe addresses and their chain information to add to the space */
  createSpaceSafesDto: CreateSpaceSafesDto
}
export type SpaceSafesGetV1ApiResponse = /** status 200 Space Safes retrieved successfully */ GetSpaceSafeResponse
export type SpaceSafesGetV1ApiArg = {
  /** Space UUID to get Safes for */
  spaceId: string
}
export type SpaceSafesDeleteV1ApiResponse = unknown
export type SpaceSafesDeleteV1ApiArg = {
  /** Space UUID to remove Safes from */
  spaceId: string
  /** List of Safe addresses and their chain information to remove from the space */
  deleteSpaceSafesDto: DeleteSpaceSafesDto
}
export type MembersInviteUserV1ApiResponse = /** status 200 Users invited successfully */ Invitation[]
export type MembersInviteUserV1ApiArg = {
  /** Space UUID to invite users to */
  spaceId: string
  /** List of wallet addresses to invite to the space */
  inviteUsersDto: InviteUsersDto
}
export type MembersAcceptInviteV1ApiResponse = unknown
export type MembersAcceptInviteV1ApiArg = {
  /** Space UUID to accept invitation for */
  spaceId: string
  /** Invitation acceptance data including any required confirmation */
  acceptInviteDto: AcceptInviteDto
}
export type MembersDeclineInviteV1ApiResponse = unknown
export type MembersDeclineInviteV1ApiArg = {
  /** Space UUID to decline invitation for */
  spaceId: string
}
export type MembersRenewInviteV1ApiResponse = /** status 200 Invitation renewed successfully */ Invitation
export type MembersRenewInviteV1ApiArg = {
  /** Space UUID containing the invitation */
  spaceId: string
  /** User ID of the invited member */
  userId: number
}
export type MembersGetUsersV1ApiResponse = /** status 200 Space members retrieved successfully */ MembersDto
export type MembersGetUsersV1ApiArg = {
  /** Space UUID to get members for */
  spaceId: string
}
export type MembersSelfRemoveV1ApiResponse = unknown
export type MembersSelfRemoveV1ApiArg = {
  /** Space UUID to remove own membership from */
  spaceId: string
}
export type MembersGetMembershipV1ApiResponse = /** status 200 Membership retrieved successfully */ MemberDto
export type MembersGetMembershipV1ApiArg = {
  /** Space UUID to fetch the caller's membership for */
  spaceId: string
}
export type MembersUpdateRoleV1ApiResponse = unknown
export type MembersUpdateRoleV1ApiArg = {
  /** Space UUID containing the member */
  spaceId: string
  /** User ID of the member to update */
  userId: number
  /** New role information for the member */
  updateRoleDto: UpdateRoleDto
}
export type MembersUpdateAliasV1ApiResponse = unknown
export type MembersUpdateAliasV1ApiArg = {
  /** Space UUID to update own member alias in */
  spaceId: string
  updateMemberAliasDto: UpdateMemberAliasDto
}
export type MembersRemoveUserV1ApiResponse = unknown
export type MembersRemoveUserV1ApiArg = {
  /** Space UUID to remove member from */
  spaceId: string
  /** User ID of the member to remove */
  userId: number
}
export type SpaceCounterfactualSafesGetV1ApiResponse =
  /** status 200 Counterfactual Safes retrieved successfully */ GetCounterfactualSafesResponse
export type SpaceCounterfactualSafesGetV1ApiArg = {
  /** Space UUID */
  spaceId: string
}
export type SpaceAddressBookItemDto = {
  name: string
  address: string
  chainIds: string[]
  /** Email or wallet address of the creator, "Unknown user" if the user has no display identity, or "Deleted user" */
  createdBy: string
  /** User ID of the creator */
  createdByUserId: number
  /** Email or wallet address of the last editor, "Unknown user" if the user has no display identity, or "Deleted user" */
  lastUpdatedBy: string
  /** User ID of the last editor */
  lastUpdatedByUserId: number
  createdAt: string
  updatedAt: string
}
export type SpaceAddressBookDto = {
  /** Space UUID */
  spaceUuid: string
  data: SpaceAddressBookItemDto[]
}
export type AddressBookItem = {
  name: string
  address: string
  chainIds: string[]
}
export type UpsertAddressBookItemsDto = {
  items: AddressBookItem[]
}
export type AddressBookRequestItemDto = {
  id: number
  name: string
  address: string
  chainIds: string[]
  /** Email or wallet address of the requester, "Unknown user" if the user has no display identity, or "Deleted user" */
  requestedBy: string
  /** User ID of the requester */
  requestedByUserId: number
  /** Email or wallet address of the reviewing admin, "Unknown user", "Deleted user", or null when still PENDING */
  reviewedBy: string | null
  /** User ID of the reviewing admin, null when still PENDING */
  reviewedByUserId: number | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
}
export type AddressBookRequestsDto = {
  /** Space UUID */
  spaceUuid: string
  data: AddressBookRequestItemDto[]
}
export type CreateAddressBookRequestDto = {
  /** Name of the proposed contact */
  name: string
  /** Address of the contact to propose for the space address book */
  address: string
  /** Chain ids the contact applies to (at least one, duplicates are removed) */
  chainIds: string[]
}
export type CreateSpaceResponse = {
  name: string
  /** Space UUID */
  uuid: string
}
export type CreateSpaceDto = {
  name: string
}
export type UserDto = {
  id: number
}
export type SpaceMemberDto = {
  role: 'ADMIN' | 'MEMBER'
  name: string
  invitedBy: number | null
  inviteExpiresAt: string | null
  invitedByName?: string
  status: 'INVITED' | 'ACTIVE' | 'DECLINED'
  user: UserDto
}
export type GetSpaceResponse = {
  /** Space UUID */
  uuid: string
  name: string
  /** Members of the space. A pending (INVITED) member only sees their own membership row here, not the other members. */
  members: SpaceMemberDto[]
  /** Total count of ACTIVE members in the space */
  memberCount: number
  /** Total count of Safes in the space */
  safeCount: number
}
export type UpdateSpaceResponse = {
  /** Space UUID */
  uuid: string
}
export type UpdateSpaceDto = {
  name?: string
  status?: 'ACTIVE'
}
export type SpaceAuditLogEntryDto = {
  /** Monotonic entry id (bigint serialized as string) */
  id: string
  eventType:
    | 'SPACE_CREATED'
    | 'SPACE_UPDATED'
    | 'SPACE_DELETED'
    | 'MEMBER_INVITED'
    | 'MEMBER_INVITE_ACCEPTED'
    | 'MEMBER_INVITE_DECLINED'
    | 'MEMBER_INVITE_RENEWED'
    | 'MEMBER_ROLE_UPDATED'
    | 'MEMBER_ALIAS_UPDATED'
    | 'MEMBER_REMOVED'
    | 'MEMBER_LEFT'
    | 'SAFE_ADDED'
    | 'SAFE_REMOVED'
    | 'ADDRESS_BOOK_UPSERTED'
    | 'ADDRESS_BOOK_DELETED'
  actorUserId: number
  /** Resolved (and masked) display string of the acting user. */
  actor: string
  /** Resolved (and masked) display string of the affected user, when the event has one. */
  targetUser: string | null
  /** Event-specific payload, allowlisted per event type. Clients must treat every field as optional. */
  payload: object
  createdAt: string
}
export type SpaceAuditLogPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: SpaceAuditLogEntryDto[]
}
export type SpaceAuditLogActorDto = {
  actorUserId: number
  /** Resolved (and masked) display string of the actor. */
  actor: string
}
export type SpaceSafeDto = {
  chainId: string
  address: string
}
export type CreateSpaceSafesDto = {
  safes: SpaceSafeDto[]
}
export type GetSpaceSafeResponse = {
  safes: {
    [key: string]: string[]
  }
}
export type DeleteSpaceSafesDto = {
  safes: SpaceSafeDto[]
}
export type Invitation = {
  userId: number
  name: string
  /** Space UUID */
  spaceUuid: string
  role: 'ADMIN' | 'MEMBER'
  status: 'INVITED' | 'ACTIVE' | 'DECLINED'
  invitedBy: number | null
}
export type WalletInviteUserDto = {
  type: 'wallet'
  address: string
  role: 'ADMIN' | 'MEMBER'
  name: string
}
export type EmailInviteUserDto = {
  type: 'email'
  email: string
  role: 'ADMIN' | 'MEMBER'
  name: string
}
export type InviteUsersDto = {
  users: (WalletInviteUserDto | EmailInviteUserDto)[]
}
export type AcceptInviteDto = {
  name: string
}
export type MemberUser = {
  id: number
  status: 'PENDING' | 'ACTIVE'
  email: string | null
}
export type MemberDto = {
  id: number
  role: 'ADMIN' | 'MEMBER'
  status: 'INVITED' | 'ACTIVE' | 'DECLINED'
  name: string
  alias?: string | null
  invitedBy: number | null
  inviteExpiresAt?: string | null
  createdAt: string
  updatedAt: string
  user: MemberUser
}
export type MembersDto = {
  members: MemberDto[]
}
export type UpdateRoleDto = {
  role: 'ADMIN' | 'MEMBER'
}
export type UpdateMemberAliasDto = {
  /** The new alias for the member */
  alias: string
}
export type GetCounterfactualSafeItem = {
  address: string
  factoryAddress: string
  masterCopy: string
  saltNonce: string
  safeVersion: string
  threshold: number
  owners: string[]
  fallbackHandler: string | null
  to: string | null
  data: string
  paymentToken: string | null
  payment: string | null
  paymentReceiver: string | null
}
export type GetCounterfactualSafesResponse = {
  safes: {
    [key: string]: GetCounterfactualSafeItem[]
  }
}
export const {
  useAddressBooksGetAddressBookItemsV1Query,
  useLazyAddressBooksGetAddressBookItemsV1Query,
  useAddressBooksUpsertAddressBookItemsV1Mutation,
  useAddressBooksDeleteByAddressV1Mutation,
  useAddressBookRequestsGetPendingRequestsV1Query,
  useLazyAddressBookRequestsGetPendingRequestsV1Query,
  useAddressBookRequestsCreateRequestV1Mutation,
  useAddressBookRequestsApproveRequestV1Mutation,
  useAddressBookRequestsRejectRequestV1Mutation,
  useSpacesCreateV1Mutation,
  useSpacesGetV1Query,
  useLazySpacesGetV1Query,
  useSpacesGetOneV1Query,
  useLazySpacesGetOneV1Query,
  useSpacesUpdateV1Mutation,
  useSpacesDeleteV1Mutation,
  useSpaceAuditGetAuditLogV1Query,
  useLazySpaceAuditGetAuditLogV1Query,
  useSpaceAuditGetAuditLogActorsV1Query,
  useLazySpaceAuditGetAuditLogActorsV1Query,
  useSpaceSafesCreateV1Mutation,
  useSpaceSafesGetV1Query,
  useLazySpaceSafesGetV1Query,
  useSpaceSafesDeleteV1Mutation,
  useMembersInviteUserV1Mutation,
  useMembersAcceptInviteV1Mutation,
  useMembersDeclineInviteV1Mutation,
  useMembersRenewInviteV1Mutation,
  useMembersGetUsersV1Query,
  useLazyMembersGetUsersV1Query,
  useMembersSelfRemoveV1Mutation,
  useMembersGetMembershipV1Query,
  useLazyMembersGetMembershipV1Query,
  useMembersUpdateRoleV1Mutation,
  useMembersUpdateAliasV1Mutation,
  useMembersRemoveUserV1Mutation,
  useSpaceCounterfactualSafesGetV1Query,
  useLazySpaceCounterfactualSafesGetV1Query,
} = injectedRtkApi
