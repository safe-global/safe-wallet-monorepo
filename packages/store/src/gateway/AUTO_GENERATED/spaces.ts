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
      spacesCreateV1: build.mutation<SpacesCreateV1ApiResponse, SpacesCreateV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces`, method: 'POST', body: queryArg.createSpaceDto }),
        invalidatesTags: ['spaces'],
      }),
      spacesGetV1: build.query<SpacesGetV1ApiResponse, SpacesGetV1ApiArg>({
        query: () => ({ url: `/v1/spaces` }),
        providesTags: ['spaces'],
      }),
      spacesCreateWithUserV1: build.mutation<SpacesCreateWithUserV1ApiResponse, SpacesCreateWithUserV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/create-with-user`, method: 'POST', body: queryArg.createSpaceDto }),
        invalidatesTags: ['spaces'],
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
      membersGetUsersV1: build.query<MembersGetUsersV1ApiResponse, MembersGetUsersV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/members` }),
        providesTags: ['spaces'],
      }),
      membersSelfRemoveV1: build.mutation<MembersSelfRemoveV1ApiResponse, MembersSelfRemoveV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/members`, method: 'DELETE' }),
        invalidatesTags: ['spaces'],
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
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type AddressBooksGetAddressBookItemsV1ApiResponse =
  /** status 200 Address book items retrieved successfully */ SpaceAddressBookDto
export type AddressBooksGetAddressBookItemsV1ApiArg = {
  /** Space ID to get address book for */
  spaceId: number
}
export type AddressBooksUpsertAddressBookItemsV1ApiResponse =
  /** status 200 Address book updated successfully */ SpaceAddressBookDto
export type AddressBooksUpsertAddressBookItemsV1ApiArg = {
  /** Space ID to update address book for */
  spaceId: number
  /** Address book items to create or update, including addresses and their labels */
  upsertAddressBookItemsDto: UpsertAddressBookItemsDto
}
export type AddressBooksDeleteByAddressV1ApiResponse = unknown
export type AddressBooksDeleteByAddressV1ApiArg = {
  /** Space ID containing the address book */
  spaceId: number
  /** Address to remove from the address book (0x prefixed hex string) */
  address: string
}
export type SpacesCreateV1ApiResponse = /** status 200 Space created successfully */ CreateSpaceResponse
export type SpacesCreateV1ApiArg = {
  /** Space creation data including the name of the space */
  createSpaceDto: CreateSpaceDto
}
export type SpacesGetV1ApiResponse = /** status 200 User spaces retrieved successfully */ GetSpaceResponse[]
export type SpacesGetV1ApiArg = void
export type SpacesCreateWithUserV1ApiResponse =
  /** status 200 Space and user created successfully */ CreateSpaceResponse
export type SpacesCreateWithUserV1ApiArg = {
  /** Space creation data including the name of the space */
  createSpaceDto: CreateSpaceDto
}
export type SpacesGetOneV1ApiResponse = /** status 200 Space information retrieved successfully */ GetSpaceResponse
export type SpacesGetOneV1ApiArg = {
  /** Space ID */
  id: number
}
export type SpacesUpdateV1ApiResponse = /** status 200 Space updated successfully */ UpdateSpaceResponse
export type SpacesUpdateV1ApiArg = {
  /** Space ID to update */
  id: number
  /** Space update data including new name or other properties */
  updateSpaceDto: UpdateSpaceDto
}
export type SpacesDeleteV1ApiResponse = unknown
export type SpacesDeleteV1ApiArg = {
  /** Space ID to delete */
  id: number
}
export type SpaceSafesCreateV1ApiResponse = unknown
export type SpaceSafesCreateV1ApiArg = {
  /** Space ID to add Safes to */
  spaceId: number
  /** List of Safe addresses and their chain information to add to the space */
  createSpaceSafesDto: CreateSpaceSafesDto
}
export type SpaceSafesGetV1ApiResponse = /** status 200 Space Safes retrieved successfully */ GetSpaceSafeResponse
export type SpaceSafesGetV1ApiArg = {
  /** Space ID to get Safes for */
  spaceId: number
}
export type SpaceSafesDeleteV1ApiResponse = unknown
export type SpaceSafesDeleteV1ApiArg = {
  /** Space ID to remove Safes from */
  spaceId: number
  /** List of Safe addresses and their chain information to remove from the space */
  deleteSpaceSafesDto: DeleteSpaceSafesDto
}
export type MembersInviteUserV1ApiResponse = /** status 200 Users invited successfully */ Invitation[]
export type MembersInviteUserV1ApiArg = {
  /** Space ID to invite users to */
  spaceId: number
  /** List of wallet addresses to invite to the space */
  inviteUsersDto: InviteUsersDto
}
export type MembersAcceptInviteV1ApiResponse = unknown
export type MembersAcceptInviteV1ApiArg = {
  /** Space ID to accept invitation for */
  spaceId: number
  /** Invitation acceptance data including any required confirmation */
  acceptInviteDto: AcceptInviteDto
}
export type MembersDeclineInviteV1ApiResponse = unknown
export type MembersDeclineInviteV1ApiArg = {
  /** Space ID to decline invitation for */
  spaceId: number
}
export type MembersGetUsersV1ApiResponse = /** status 200 Space members retrieved successfully */ MembersDto
export type MembersGetUsersV1ApiArg = {
  /** Space ID to get members for */
  spaceId: number
}
export type MembersSelfRemoveV1ApiResponse = unknown
export type MembersSelfRemoveV1ApiArg = {
  spaceId: number
}
export type MembersUpdateRoleV1ApiResponse = unknown
export type MembersUpdateRoleV1ApiArg = {
  /** Space ID containing the member */
  spaceId: number
  /** User ID of the member to update */
  userId: number
  /** New role information for the member */
  updateRoleDto: UpdateRoleDto
}
export type MembersUpdateAliasV1ApiResponse = unknown
export type MembersUpdateAliasV1ApiArg = {
  spaceId: number
  updateMemberAliasDto: UpdateMemberAliasDto
}
export type MembersRemoveUserV1ApiResponse = unknown
export type MembersRemoveUserV1ApiArg = {
  /** Space ID to remove member from */
  spaceId: number
  /** User ID of the member to remove */
  userId: number
}
export type SpaceAddressBookItemDto = {
  name: string
  address: string
  chainIds: string[]
  createdBy: string
  lastUpdatedBy: string
}
export type SpaceAddressBookDto = {
  spaceId: string
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
export type CreateSpaceResponse = {
  name: string
  id: number
}
export type CreateSpaceDto = {
  name: string
}
export type UserDto = {
  id: number
}
export type MemberDto = {
  role: 'ADMIN' | 'MEMBER'
  name: string
  invitedBy: string
  status: 'INVITED' | 'ACTIVE' | 'DECLINED'
  user: UserDto
}
export type GetSpaceResponse = {
  id: number
  name: string
  members: MemberDto[]
  /** Total count of Safes in the space */
  safeCount: number
}
export type UpdateSpaceResponse = {
  id: number
}
export type UpdateSpaceDto = {
  name?: string
  status?: 'ACTIVE'
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
  spaceId: number
  role: 'ADMIN' | 'MEMBER'
  status: 'INVITED' | 'ACTIVE' | 'DECLINED'
  invitedBy?: string | null
}
export type InviteUserDto = {
  address: string
  name: string
  role: 'ADMIN' | 'MEMBER'
}
export type InviteUsersDto = {
  users: InviteUserDto[]
}
export type AcceptInviteDto = {
  name: string
}
export type MemberUser = {
  id: number
  status: 'PENDING' | 'ACTIVE'
}
export type Member = {
  id: number
  role: 'ADMIN' | 'MEMBER'
  status: 'INVITED' | 'ACTIVE' | 'DECLINED'
  name: string
  alias?: string | null
  invitedBy?: string | null
  createdAt: string
  updatedAt: string
  user: MemberUser
}
export type MembersDto = {
  members: Member[]
}
export type UpdateRoleDto = {
  role: 'ADMIN' | 'MEMBER'
}
export type UpdateMemberAliasDto = {
  /** The new alias for the member */
  alias: string
}
export const {
  useAddressBooksGetAddressBookItemsV1Query,
  useLazyAddressBooksGetAddressBookItemsV1Query,
  useAddressBooksUpsertAddressBookItemsV1Mutation,
  useAddressBooksDeleteByAddressV1Mutation,
  useSpacesCreateV1Mutation,
  useSpacesGetV1Query,
  useLazySpacesGetV1Query,
  useSpacesCreateWithUserV1Mutation,
  useSpacesGetOneV1Query,
  useLazySpacesGetOneV1Query,
  useSpacesUpdateV1Mutation,
  useSpacesDeleteV1Mutation,
  useSpaceSafesCreateV1Mutation,
  useSpaceSafesGetV1Query,
  useLazySpaceSafesGetV1Query,
  useSpaceSafesDeleteV1Mutation,
  useMembersInviteUserV1Mutation,
  useMembersAcceptInviteV1Mutation,
  useMembersDeclineInviteV1Mutation,
  useMembersGetUsersV1Query,
  useLazyMembersGetUsersV1Query,
  useMembersSelfRemoveV1Mutation,
  useMembersUpdateRoleV1Mutation,
  useMembersUpdateAliasV1Mutation,
  useMembersRemoveUserV1Mutation,
} = injectedRtkApi
