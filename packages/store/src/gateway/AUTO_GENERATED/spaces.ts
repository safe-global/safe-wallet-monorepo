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
      addressBooksSetContactTagsV1: build.mutation<
        AddressBooksSetContactTagsV1ApiResponse,
        AddressBooksSetContactTagsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/address-book/tags`,
          method: 'PUT',
          body: queryArg.setContactTagsDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      addressBooksCreateTagV1: build.mutation<AddressBooksCreateTagV1ApiResponse, AddressBooksCreateTagV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/address-book/tags`,
          method: 'POST',
          body: queryArg.createTagDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      addressBooksRenameTagV1: build.mutation<AddressBooksRenameTagV1ApiResponse, AddressBooksRenameTagV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/address-book/tags/${queryArg.tagId}`,
          method: 'PATCH',
          body: queryArg.renameTagDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      addressBooksDeleteTagV1: build.mutation<AddressBooksDeleteTagV1ApiResponse, AddressBooksDeleteTagV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/address-book/tags/${queryArg.tagId}`,
          method: 'DELETE',
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
      spaceSafesGetAllV1: build.query<SpaceSafesGetAllV1ApiResponse, SpaceSafesGetAllV1ApiArg>({
        query: () => ({ url: `/v1/spaces/safes` }),
        providesTags: ['spaces'],
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
      policiesCreateConfigurationRequestV1: build.mutation<
        PoliciesCreateConfigurationRequestV1ApiResponse,
        PoliciesCreateConfigurationRequestV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/policies/requests`,
          method: 'POST',
          body: queryArg.createPolicyConfigurationRequestDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      spacePoliciesGetActivePoliciesV1: build.query<
        SpacePoliciesGetActivePoliciesV1ApiResponse,
        SpacePoliciesGetActivePoliciesV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/policies/active`,
          params: {
            types: queryArg.types,
            safes: queryArg.safes,
          },
        }),
        providesTags: ['spaces'],
      }),
      spacePoliciesGetPendingPoliciesV1: build.query<
        SpacePoliciesGetPendingPoliciesV1ApiResponse,
        SpacePoliciesGetPendingPoliciesV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/policies/pending`,
          params: {
            types: queryArg.types,
            safes: queryArg.safes,
            include_guard_installation: queryArg.includeGuardInstallation,
          },
        }),
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
export type AddressBooksSetContactTagsV1ApiResponse = /** status 200 Tags set successfully */ SpaceAddressBookDto
export type AddressBooksSetContactTagsV1ApiArg = {
  /** Space UUID containing the address book */
  spaceId: string
  /** The entries to tag, each with its full set of tag names */
  setContactTagsDto: SetContactTagsDto
}
export type AddressBooksCreateTagV1ApiResponse = /** status 201 Tag created successfully */ SpaceAddressBookDto
export type AddressBooksCreateTagV1ApiArg = {
  /** Space UUID containing the address book */
  spaceId: string
  /** The tag name */
  createTagDto: CreateTagDto
}
export type AddressBooksRenameTagV1ApiResponse = /** status 200 Tag renamed successfully */ SpaceAddressBookDto
export type AddressBooksRenameTagV1ApiArg = {
  /** Space UUID containing the address book */
  spaceId: string
  /** ID of the tag to rename */
  tagId: number
  /** The new tag name */
  renameTagDto: RenameTagDto
}
export type AddressBooksDeleteTagV1ApiResponse = unknown
export type AddressBooksDeleteTagV1ApiArg = {
  /** Space UUID containing the address book */
  spaceId: string
  /** ID of the tag to delete */
  tagId: number
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
export type SpaceSafesGetAllV1ApiResponse =
  /** status 200 Safes of all spaces retrieved successfully */ GetSpacesSafesResponse[]
export type SpaceSafesGetAllV1ApiArg = void
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
export type PoliciesCreateConfigurationRequestV1ApiResponse =
  /** status 201  */ CreatePolicyConfigurationRequestResponse
export type PoliciesCreateConfigurationRequestV1ApiArg = {
  /** Space UUID the Safe belongs to */
  spaceId: string
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address, must be registered to the Space */
  safeAddress: string
  createPolicyConfigurationRequestDto: CreatePolicyConfigurationRequestDto
}
export type SpacePoliciesGetActivePoliciesV1ApiResponse = /** status 200  */ ActivePolicyDto[]
export type SpacePoliciesGetActivePoliciesV1ApiArg = {
  /** Space UUID */
  spaceId: string
  /** The policy types to report, comma-separated. */
  types: string[]
  /** Narrow the read to a subset of the Space's Safes, comma-separated as `{chainId}:{safeAddress}` */
  safes?: string
}
export type SpacePoliciesGetPendingPoliciesV1ApiResponse = /** status 200  */ (
  | ({
      kind: 'queued-transaction'
    } & PendingPolicyDto)
  | ({
      kind: 'guard-installation'
    } & PendingGuardInstallationDto)
  | ({
      kind: 'immediate-guard-policies'
    } & PendingImmediateGuardPoliciesDto)
  | ({
      kind: 'delayed-guard-policies'
    } & PendingDelayedGuardPoliciesDto)
)[]
export type SpacePoliciesGetPendingPoliciesV1ApiArg = {
  /** Space UUID */
  spaceId: string
  /** The policy types to report, comma-separated. `spending-limit` returns queued AllowanceModule changes. A guard type (`allow`, `deny`, `cosigner`, `erc20-transfer`, `multisend`, `native-transfer`) returns the delayed `SafePolicyGuard` configurations that may set a policy of that type. `proposer` and `recovery` return none. */
  types: string[]
  /** Narrow the read to a subset of the Space's Safes, comma-separated as `{chainId}:{safeAddress}` */
  safes?: string[]
  /** Also report the queued `setGuard` and `setModuleGuard` calls that install, replace or remove a `SafePolicyGuard` on each Safe, as `guard-installation` items. */
  includeGuardInstallation?: boolean
}
export type SpaceAddressBookItemDto = {
  name: string
  address: string
  chainIds: string[]
  /** IDs of the workspace tags assigned to the contact */
  tagIds: number[]
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
export type SpaceAddressBookTagDto = {
  id: number
  name: string
  color: 'slate' | 'clay' | 'rose' | 'lilac' | 'iris' | 'cobalt' | 'sky' | 'lagoon'
  /** Number of contacts that have this tag */
  contactCount: number
}
export type SpaceAddressBookDto = {
  /** Space UUID */
  spaceUuid: string
  data: SpaceAddressBookItemDto[]
  /** All tags defined in the workspace address book */
  tags: SpaceAddressBookTagDto[]
}
export type UpsertAddressBookItem = {
  name: string
  address: string
  chainIds: string[]
  /** Tag names of the contact (replaces the current tags when provided; omit to leave them unchanged) */
  tags?: string[]
}
export type UpsertAddressBookItemsDto = {
  items: UpsertAddressBookItem[]
}
export type SetContactTagsItem = {
  address: string
  /** The full set of tag names for the contact. 'Workspace Safe' and 'Signer' aren't allowed, in any case */
  tags: string[]
}
export type SetContactTagsDto = {
  /** At most as many entries as the address book can hold, each address at most once */
  items: SetContactTagsItem[]
}
export type CreateTagDto = {
  /** 'Workspace Safe' and 'Signer' aren't allowed, in any case */
  name: string
}
export type RenameTagDto = {
  /** 'Workspace Safe' and 'Signer' aren't allowed, in any case */
  name: string
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
  /** Experimental features this Workspace has opted into. */
  experimentalFeatures: 'POLICY_RECIPIENT_ALLOWLIST'[]
}
export type UpdateSpaceResponse = {
  /** Space UUID */
  uuid: string
}
export type UpdateSpaceDto = {
  name?: string
  status?: 'ACTIVE'
  /** Replaces the stored set; [] opts out of all. Omit to leave it unchanged. */
  experimentalFeatures?: 'POLICY_RECIPIENT_ALLOWLIST'[]
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
    | 'ADDRESS_BOOK_REQUEST_CREATED'
    | 'ADDRESS_BOOK_REQUEST_REJECTED'
    | 'ADDRESS_BOOK_TAGS_UPDATED'
    | 'ADDRESS_BOOK_TAG_CREATED'
    | 'ADDRESS_BOOK_TAG_RENAMED'
    | 'ADDRESS_BOOK_TAG_DELETED'
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
export type AddressBookItem = {
  name: string
  address: string
  chainIds: string[]
}
export type CreateSpaceSafesDto = {
  safes: SpaceSafeDto[]
  /** Address book entries to upsert for the added Safes, in the same transaction: if either write fails, neither is kept. */
  addressBookItems?: AddressBookItem[]
}
export type GetSpaceSafeResponse = {
  safes: {
    [key: string]: string[]
  }
}
export type DeleteSpaceSafesDto = {
  safes: SpaceSafeDto[]
}
export type GetSpacesSafesResponse = {
  safes: {
    [key: string]: string[]
  }
  /** Space UUID */
  spaceUuid: string
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
  address: string | null
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
export type CreatePolicyConfigurationRequestResponse = {
  /** The stored configuration root */
  root: string
}
export type PolicyConfigurationDto = {
  /** Contract the guarded call targets */
  target: string
  /** 4-byte function selector */
  selector: string
  /** 0 = CALL, 1 = DELEGATECALL */
  operation: 0 | 1
  /** Policy contract to bind. The zero address removes the policy of this access. */
  policy: string
  /** Policy payload, abi-encoded as passed to the guard. At most 64 KiB (65,536 bytes). */
  data: string
}
export type CreatePolicyConfigurationRequestDto = {
  /** keccak256(abi.encode(Configuration[])), as requested on-chain */
  root: string
  configurations: PolicyConfigurationDto[]
}
export type ModuleEnforcementDto = {
  via: 'module'
  /** The module enforcing the policy */
  moduleAddress: string
}
export type PolicyContractsDto = {
  /** The policy implementation the guard delegates to */
  policyContract: string
  /** The SafePolicyGuard deployment */
  safePolicyGuard: string
}
export type GuardSlotsDto = {
  transactionGuard?: PolicyContractsDto
  moduleGuard?: PolicyContractsDto
}
export type PolicyAccessDto = {
  /** The contract the governed calls target */
  target: string
  /** The 4-byte function selector of the governed calls */
  selector: string
  operation: 'CALL' | 'DELEGATECALL'
}
export type GuardEnforcementDto = {
  via: 'guard'
  guards: GuardSlotsDto
  /** The calls the guard applies the policy to */
  access: PolicyAccessDto
}
export type OffChainEnforcementDto = {
  /** Nothing on chain enforces the policy, so it is access rather than an audited restriction */
  via: 'offchain'
  /** Where the grant is held */
  source: 'delegates'
}
export type NativeTokenMetadataDto = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  /** Whether the Transaction Service lists the token in one of its imported token lists */
  trusted: boolean
  type: 'NATIVE_TOKEN'
}
export type Erc20TokenMetadataDto = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  /** Whether the Transaction Service lists the token in one of its imported token lists */
  trusted: boolean
  type: 'ERC20'
}
export type SpendingLimitAllowanceDto = {
  /** The token the limit applies to; zero address for native */
  tokenAddress: string
  /** Metadata of `tokenAddress`; null when it could not be resolved */
  tokenMetadata:
    | (
        | ({
            type: 'NATIVE_TOKEN'
          } & NativeTokenMetadataDto)
        | ({
            type: 'ERC20'
          } & Erc20TokenMetadataDto)
      )
    | null
  /** Per-window ceiling, in base units */
  amount: string
  /** Spent in the current window, in base units */
  spent: string
  /** Window length in minutes; 0 never resets */
  resetPeriodMinutes: number
  /** Minutes since the epoch of the next reset, the unit the module counts windows in; null when it never resets */
  resetsAtMinute: number | null
  /** False when the reset boundary could not be recovered exactly, so `resetsAtMinute` may be up to one period out. `amount` is unaffected. */
  resetBoundaryIsExact: boolean
  /** False when the spender's delegate registration was removed: nothing is spendable now, but the allowance returns to effect if the delegate is re-added */
  isDelegateActive: boolean
  /** Unix seconds this allowance was (re-)established */
  createdAt: number
  /** Unix seconds of the last event that changed this allowance */
  updatedAt: number
}
export type SpendingLimitSpenderDto = {
  /** Name resolved by the client, never carried here */
  spender: string
  /** False when the spender is deregistered: nothing is spendable now, but the allowances survive and return if it is re-added */
  isActive: boolean
  allowances: SpendingLimitAllowanceDto[]
}
export type SpendingLimitPolicyDataDto = {
  /** The allowance module holding this state */
  module: string
  spenders: SpendingLimitSpenderDto[]
}
export type ProposerGrantDto = {
  /** The owner that granted the proposer */
  delegator: string
  /** The label this owner gave the proposer; empty when unlabelled */
  label: string
}
export type ProposerDto = {
  /** The address allowed to propose transactions */
  proposer: string
  /** The owners that granted it, each with the label they gave. The label is stored per grant, so two owners can label the same proposer differently */
  delegatedBy: ProposerGrantDto[]
}
export type ProposerPolicyDataDto = {
  proposers: ProposerDto[]
}
export type Erc20TransferRecipientDto = {
  /** An address the Safe can send this token to */
  account: string
  permission: 'ONCE' | 'ALWAYS'
}
export type Erc20TransferPolicyDataDto = {
  /** The ERC20 token the allowlist applies to */
  tokenAddress: string
  /** Metadata of `tokenAddress`; null when it could not be resolved */
  tokenMetadata:
    | (
        | ({
            type: 'NATIVE_TOKEN'
          } & NativeTokenMetadataDto)
        | ({
            type: 'ERC20'
          } & Erc20TokenMetadataDto)
      )
    | null
  /** The recipients of the token transfers the policy permits */
  recipients: Erc20TransferRecipientDto[]
}
export type CosignerPolicyDataDto = {
  /** The cosigner the policy enforces. */
  cosignerAddress: string
}
export type StatelessPolicyDataDto = {}
export type SafeRefDto = {
  chainId: string
  address: string
}
export type ActivePolicyDto = {
  type:
    | 'spending-limit'
    | 'recovery'
    | 'proposer'
    | 'erc20-transfer'
    | 'cosigner'
    | 'allow'
    | 'native-transfer'
    | 'deny'
    | 'multisend'
  enforcement:
    | ({
        via: 'module'
      } & ModuleEnforcementDto)
    | ({
        via: 'guard'
      } & GuardEnforcementDto)
    | ({
        via: 'offchain'
      } & OffChainEnforcementDto)
  /** False when the policy is configured but not enforced */
  enabled: boolean
  data:
    | SpendingLimitPolicyDataDto
    | ProposerPolicyDataDto
    | Erc20TransferPolicyDataDto
    | CosignerPolicyDataDto
    | StatelessPolicyDataDto
  /** The Safe the policy is in effect on */
  safe: SafeRefDto
}
export type EnableModuleChangeDto = {
  kind: 'enable-module'
}
export type AddDelegateChangeDto = {
  kind: 'add-delegate'
  /** The address being added as a delegate in AllowanceModule contract */
  delegate: string
}
export type RemoveDelegateChangeDto = {
  kind: 'remove-delegate'
  /** The delegate being removed */
  delegate: string
  /** Whether the delegate's allowances are deleted along with it */
  removeAllowances: boolean
}
export type SetAllowanceChangeDto = {
  kind: 'set-allowance'
  delegate: string
  /** The token the limit applies to; zero address for native */
  token: string
  /** Metadata of `token`; null when it could not be resolved */
  tokenMetadata:
    | (
        | ({
            type: 'NATIVE_TOKEN'
          } & NativeTokenMetadataDto)
        | ({
            type: 'ERC20'
          } & Erc20TokenMetadataDto)
      )
    | null
  /** Per-window ceiling, in base units */
  amount: string
  /** Window length in minutes; 0 never resets */
  resetPeriodMinutes: number
}
export type ResetAllowanceChangeDto = {
  kind: 'reset-allowance'
  delegate: string
  token: string
  /** Metadata of `token`; null when it could not be resolved */
  tokenMetadata:
    | (
        | ({
            type: 'NATIVE_TOKEN'
          } & NativeTokenMetadataDto)
        | ({
            type: 'ERC20'
          } & Erc20TokenMetadataDto)
      )
    | null
}
export type DeleteAllowanceChangeDto = {
  kind: 'delete-allowance'
  delegate: string
  token: string
  /** Metadata of `token`; null when it could not be resolved */
  tokenMetadata:
    | (
        | ({
            type: 'NATIVE_TOKEN'
          } & NativeTokenMetadataDto)
        | ({
            type: 'ERC20'
          } & Erc20TokenMetadataDto)
      )
    | null
}
export type PendingSpendingLimitDataDto = {
  /** The AllowanceModule deployment holding this state */
  module: string
  /** The AllowanceModule calls this transaction decodes to */
  changes: (
    | ({
        kind: 'enable-module'
      } & EnableModuleChangeDto)
    | ({
        kind: 'add-delegate'
      } & AddDelegateChangeDto)
    | ({
        kind: 'remove-delegate'
      } & RemoveDelegateChangeDto)
    | ({
        kind: 'set-allowance'
      } & SetAllowanceChangeDto)
    | ({
        kind: 'reset-allowance'
      } & ResetAllowanceChangeDto)
    | ({
        kind: 'delete-allowance'
      } & DeleteAllowanceChangeDto)
  )[]
}
export type PendingPolicyDto = {
  kind: 'queued-transaction'
  type: 'spending-limit'
  enforcement: ModuleEnforcementDto
  /** The queued transaction this change was found in */
  safeTxHash: string
  nonce: number
  confirmations: number
  confirmationsRequired: number
  /** Unix seconds the transaction was proposed at */
  proposedAt: number
  /** The owner or delegate who proposed the transaction, if known */
  proposer: string | null
  data: PendingSpendingLimitDataDto
  /** The Safe the change is queued on */
  safe: SafeRefDto
}
export type SetGuardChangeDto = {
  kind: 'set-guard'
  /** The transaction guard before this call; null for none */
  from: string | null
  /** The transaction guard after this call; null removes it */
  to: string | null
}
export type SetModuleGuardChangeDto = {
  kind: 'set-module-guard'
  /** The module guard before this call; null for none */
  from: string | null
  /** The module guard after this call; null removes it */
  to: string | null
}
export type PendingTransactionDto = {
  safeTxHash: string
  nonce: number
  confirmations: number
  confirmationsRequired: number
  /** Unix seconds the transaction was proposed at */
  proposedAt: number
  /** The owner or delegate who proposed the transaction, if known */
  proposer: string | null
}
export type PendingGuardInstallationDto = {
  kind: 'guard-installation'
  status: 'in-signing' | 'ready'
  /** The Safe the transaction is queued on */
  safe: SafeRefDto
  /** The guard installation calls of the transaction, in calldata order */
  changes: (
    | ({
        kind: 'set-guard'
      } & SetGuardChangeDto)
    | ({
        kind: 'set-module-guard'
      } & SetModuleGuardChangeDto)
  )[]
  transaction: PendingTransactionDto
}
export type PendingImmediateGuardPoliciesDto = {
  kind: 'immediate-guard-policies'
  status: 'in-signing' | 'ready'
  /** The Safe the transaction is queued on */
  safe: SafeRefDto
  /** The SafePolicyGuard the policies are bound on */
  guard: string
  /** The configurations configureImmediately binds */
  configurations: PolicyConfigurationDto[]
  transaction: PendingTransactionDto
}
export type PendingDelayedGuardPoliciesDto = {
  kind: 'delayed-guard-policies'
  /** draft: stored in CGW, no transaction in signing yet. configuration-in-signing: requestConfiguration is queued. pending-application: requested, waiting for or past readyAt. application-in-signing: applyConfiguration is queued and collecting signatures. application-ready: applyConfiguration is signed and can execute. expired: the application window has closed. */
  status:
    | 'draft'
    | 'configuration-in-signing'
    | 'pending-application'
    | 'application-in-signing'
    | 'application-ready'
    | 'expired'
  /** The Safe the configuration belongs to */
  safe: SafeRefDto
  /** The SafePolicyGuard of the root; null for a draft */
  guard: string | null
  /** keccak256(abi.encode(Configuration[])) */
  root: string
  /** The configurations behind the root; null when CGW does not know them */
  configurations: PolicyConfigurationDto[] | null
  /** Unix seconds applyConfiguration is valid from; null until the root is requested on-chain */
  readyAt: number | null
  /** Unix seconds the application window closes; null until the root is requested on-chain */
  expiresAt: number | null
  /** The queued request or apply transaction, if any */
  transaction: PendingTransactionDto | null
  /** Unix seconds the change was first seen: when CGW stored its configurations, else when its queued transaction was proposed. Null for a root requested outside the wallet. */
  createdAt: number | null
}
export const {
  useAddressBooksGetAddressBookItemsV1Query,
  useLazyAddressBooksGetAddressBookItemsV1Query,
  useAddressBooksUpsertAddressBookItemsV1Mutation,
  useAddressBooksSetContactTagsV1Mutation,
  useAddressBooksCreateTagV1Mutation,
  useAddressBooksRenameTagV1Mutation,
  useAddressBooksDeleteTagV1Mutation,
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
  useSpaceSafesGetAllV1Query,
  useLazySpaceSafesGetAllV1Query,
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
  usePoliciesCreateConfigurationRequestV1Mutation,
  useSpacePoliciesGetActivePoliciesV1Query,
  useLazySpacePoliciesGetActivePoliciesV1Query,
  useSpacePoliciesGetPendingPoliciesV1Query,
  useLazySpacePoliciesGetPendingPoliciesV1Query,
} = injectedRtkApi
