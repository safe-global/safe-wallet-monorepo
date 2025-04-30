import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['spaces'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
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
      membersUpdateRoleV1: build.mutation<MembersUpdateRoleV1ApiResponse, MembersUpdateRoleV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/members/${queryArg.userId}/role`,
          method: 'PATCH',
          body: queryArg.updateRoleDto,
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
export type SpacesCreateV1ApiResponse = /** status 200 Space created */ CreateSpaceResponse
export type SpacesCreateV1ApiArg = {
  createSpaceDto: CreateSpaceDto
}
export type SpacesGetV1ApiResponse = /** status 200 Spaces found */ GetSpaceResponse[]
export type SpacesGetV1ApiArg = void
export type SpacesCreateWithUserV1ApiResponse = /** status 200 Space created */ CreateSpaceResponse
export type SpacesCreateWithUserV1ApiArg = {
  createSpaceDto: CreateSpaceDto
}
export type SpacesGetOneV1ApiResponse = /** status 200 Space found */ GetSpaceResponse
export type SpacesGetOneV1ApiArg = {
  id: number
}
export type SpacesUpdateV1ApiResponse = /** status 200 Space updated */ UpdateSpaceResponse
export type SpacesUpdateV1ApiArg = {
  id: number
  updateSpaceDto: UpdateSpaceDto
}
export type SpacesDeleteV1ApiResponse = unknown
export type SpacesDeleteV1ApiArg = {
  id: number
}
export type SpaceSafesCreateV1ApiResponse = unknown
export type SpaceSafesCreateV1ApiArg = {
  spaceId: number
  createSpaceSafesDto: CreateSpaceSafesDto
}
export type SpaceSafesGetV1ApiResponse = /** status 200 Safes fetched successfully */ GetSpaceSafeResponse
export type SpaceSafesGetV1ApiArg = {
  spaceId: number
}
export type SpaceSafesDeleteV1ApiResponse = unknown
export type SpaceSafesDeleteV1ApiArg = {
  spaceId: number
  deleteSpaceSafesDto: DeleteSpaceSafesDto
}
export type MembersInviteUserV1ApiResponse = /** status 200 Users invited */ Invitation[]
export type MembersInviteUserV1ApiArg = {
  spaceId: number
  inviteUsersDto: InviteUsersDto
}
export type MembersAcceptInviteV1ApiResponse = unknown
export type MembersAcceptInviteV1ApiArg = {
  spaceId: number
  acceptInviteDto: AcceptInviteDto
}
export type MembersDeclineInviteV1ApiResponse = unknown
export type MembersDeclineInviteV1ApiArg = {
  spaceId: number
}
export type MembersGetUsersV1ApiResponse = /** status 200 Space and members list */ MembersDto
export type MembersGetUsersV1ApiArg = {
  spaceId: number
}
export type MembersUpdateRoleV1ApiResponse = unknown
export type MembersUpdateRoleV1ApiArg = {
  spaceId: number
  userId: number
  updateRoleDto: UpdateRoleDto
}
export type MembersRemoveUserV1ApiResponse = unknown
export type MembersRemoveUserV1ApiArg = {
  spaceId: number
  userId: number
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
  status: 'PENDING' | 'ACTIVE'
}
export type MemberDto = {
  id: number
  role: 'ADMIN' | 'MEMBER'
  name: string
  invitedBy: string
  status: 'INVITED' | 'ACTIVE' | 'DECLINED'
  createdAt: string
  updatedAt: string
  user: UserDto
}
export type GetSpaceResponse = {
  id: number
  name: string
  status: 'ACTIVE'
  members: MemberDto[]
}
export type UpdateSpaceResponse = {
  id: number
}
export type UpdateSpaceDto = {
  name?: string
  status?: 'ACTIVE'
}
export type CreateSpaceSafeDto = {
  chainId: string
  address: string
}
export type CreateSpaceSafesDto = {
  safes: CreateSpaceSafeDto[]
}
export type GetSpaceSafeResponse = {
  safes: {
    [key: string]: string[]
  }
}
export type DeleteSpaceSafeDto = {
  chainId: string
  address: string
}
export type DeleteSpaceSafesDto = {
  safes: DeleteSpaceSafeDto[]
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
export const {
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
  useMembersUpdateRoleV1Mutation,
  useMembersRemoveUserV1Mutation,
} = injectedRtkApi
