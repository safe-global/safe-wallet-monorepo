import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['organizations', 'organizations-safe'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      organizationsCreateV1: build.mutation<OrganizationsCreateV1ApiResponse, OrganizationsCreateV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/organizations`, method: 'POST', body: queryArg.createOrganizationDto }),
        invalidatesTags: ['organizations'],
      }),
      organizationsGetV1: build.query<OrganizationsGetV1ApiResponse, OrganizationsGetV1ApiArg>({
        query: () => ({ url: `/v1/organizations` }),
        providesTags: ['organizations'],
      }),
      organizationsCreateWithUserV1: build.mutation<
        OrganizationsCreateWithUserV1ApiResponse,
        OrganizationsCreateWithUserV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/organizations/create-with-user`,
          method: 'POST',
          body: queryArg.createOrganizationDto,
        }),
        invalidatesTags: ['organizations'],
      }),
      organizationsGetOneV1: build.query<OrganizationsGetOneV1ApiResponse, OrganizationsGetOneV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/organizations/${queryArg.id}` }),
        providesTags: ['organizations'],
      }),
      organizationsUpdateV1: build.mutation<OrganizationsUpdateV1ApiResponse, OrganizationsUpdateV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/organizations/${queryArg.id}`,
          method: 'PATCH',
          body: queryArg.updateOrganizationDto,
        }),
        invalidatesTags: ['organizations'],
      }),
      organizationsDeleteV1: build.mutation<OrganizationsDeleteV1ApiResponse, OrganizationsDeleteV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/organizations/${queryArg.id}`, method: 'DELETE' }),
        invalidatesTags: ['organizations'],
      }),
      organizationSafesCreateV1: build.mutation<OrganizationSafesCreateV1ApiResponse, OrganizationSafesCreateV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/organizations/${queryArg.organizationId}/safes`,
          method: 'POST',
          body: queryArg.createOrganizationSafesDto,
        }),
        invalidatesTags: ['organizations-safe'],
      }),
      organizationSafesGetV1: build.query<OrganizationSafesGetV1ApiResponse, OrganizationSafesGetV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/organizations/${queryArg.organizationId}/safes` }),
        providesTags: ['organizations-safe'],
      }),
      organizationSafesDeleteV1: build.mutation<OrganizationSafesDeleteV1ApiResponse, OrganizationSafesDeleteV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/organizations/${queryArg.organizationId}/safes`,
          method: 'DELETE',
          body: queryArg.deleteOrganizationSafesDto,
        }),
        invalidatesTags: ['organizations-safe'],
      }),
      userOrganizationsInviteUserV1: build.mutation<
        UserOrganizationsInviteUserV1ApiResponse,
        UserOrganizationsInviteUserV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/organizations/${queryArg.orgId}/members/invite`,
          method: 'POST',
          body: queryArg.inviteUsersDto,
        }),
        invalidatesTags: ['organizations'],
      }),
      userOrganizationsAcceptInviteV1: build.mutation<
        UserOrganizationsAcceptInviteV1ApiResponse,
        UserOrganizationsAcceptInviteV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/organizations/${queryArg.orgId}/members/accept`,
          method: 'POST',
          body: queryArg.acceptInviteDto,
        }),
        invalidatesTags: ['organizations'],
      }),
      userOrganizationsDeclineInviteV1: build.mutation<
        UserOrganizationsDeclineInviteV1ApiResponse,
        UserOrganizationsDeclineInviteV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/organizations/${queryArg.orgId}/members/decline`, method: 'POST' }),
        invalidatesTags: ['organizations'],
      }),
      userOrganizationsGetUsersV1: build.query<
        UserOrganizationsGetUsersV1ApiResponse,
        UserOrganizationsGetUsersV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/organizations/${queryArg.orgId}/members` }),
        providesTags: ['organizations'],
      }),
      userOrganizationsUpdateRoleV1: build.mutation<
        UserOrganizationsUpdateRoleV1ApiResponse,
        UserOrganizationsUpdateRoleV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/organizations/${queryArg.orgId}/members/${queryArg.userId}/role`,
          method: 'PATCH',
          body: queryArg.updateRoleDto,
        }),
        invalidatesTags: ['organizations'],
      }),
      userOrganizationsRemoveUserV1: build.mutation<
        UserOrganizationsRemoveUserV1ApiResponse,
        UserOrganizationsRemoveUserV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/organizations/${queryArg.orgId}/members/${queryArg.userId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['organizations'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type OrganizationsCreateV1ApiResponse = /** status 200 Organization created */ CreateOrganizationResponse
export type OrganizationsCreateV1ApiArg = {
  createOrganizationDto: CreateOrganizationDto
}
export type OrganizationsGetV1ApiResponse = /** status 200 Organizations found */ GetOrganizationResponse[]
export type OrganizationsGetV1ApiArg = void
export type OrganizationsCreateWithUserV1ApiResponse = /** status 200 Organization created */ CreateOrganizationResponse
export type OrganizationsCreateWithUserV1ApiArg = {
  createOrganizationDto: CreateOrganizationDto
}
export type OrganizationsGetOneV1ApiResponse = /** status 200 Organization found */ GetOrganizationResponse
export type OrganizationsGetOneV1ApiArg = {
  id: number
}
export type OrganizationsUpdateV1ApiResponse = /** status 200 Organization updated */ UpdateOrganizationResponse
export type OrganizationsUpdateV1ApiArg = {
  id: number
  updateOrganizationDto: UpdateOrganizationDto
}
export type OrganizationsDeleteV1ApiResponse = unknown
export type OrganizationsDeleteV1ApiArg = {
  id: number
}
export type OrganizationSafesCreateV1ApiResponse = unknown
export type OrganizationSafesCreateV1ApiArg = {
  organizationId: number
  createOrganizationSafesDto: CreateOrganizationSafesDto
}
export type OrganizationSafesGetV1ApiResponse = /** status 200 Safes fetched successfully */ GetOrganizationSafeResponse
export type OrganizationSafesGetV1ApiArg = {
  organizationId: number
}
export type OrganizationSafesDeleteV1ApiResponse = unknown
export type OrganizationSafesDeleteV1ApiArg = {
  organizationId: number
  deleteOrganizationSafesDto: DeleteOrganizationSafesDto
}
export type UserOrganizationsInviteUserV1ApiResponse = /** status 200 Users invited */ Invitation[]
export type UserOrganizationsInviteUserV1ApiArg = {
  orgId: number
  inviteUsersDto: InviteUsersDto
}
export type UserOrganizationsAcceptInviteV1ApiResponse = unknown
export type UserOrganizationsAcceptInviteV1ApiArg = {
  orgId: number
  acceptInviteDto: AcceptInviteDto
}
export type UserOrganizationsDeclineInviteV1ApiResponse = unknown
export type UserOrganizationsDeclineInviteV1ApiArg = {
  orgId: number
}
export type UserOrganizationsGetUsersV1ApiResponse =
  /** status 200 Organization and members list */ UserOrganizationsDto
export type UserOrganizationsGetUsersV1ApiArg = {
  orgId: number
}
export type UserOrganizationsUpdateRoleV1ApiResponse = unknown
export type UserOrganizationsUpdateRoleV1ApiArg = {
  orgId: number
  userId: number
  updateRoleDto: UpdateRoleDto
}
export type UserOrganizationsRemoveUserV1ApiResponse = unknown
export type UserOrganizationsRemoveUserV1ApiArg = {
  orgId: number
  userId: number
}
export type CreateOrganizationResponse = {
  name: string
  id: number
}
export type CreateOrganizationDto = {
  name: string
}
export type UserDto = {
  id: number
  status: 'PENDING' | 'ACTIVE'
}
export type UserOrganizationDto = {
  id: number
  role: 'ADMIN' | 'MEMBER'
  name: string
  invitedBy: string
  status: 'INVITED' | 'ACTIVE' | 'DECLINED'
  createdAt: string
  updatedAt: string
  user: UserDto
}
export type GetOrganizationResponse = {
  id: number
  name: string
  status: 'ACTIVE'
  userOrganizations: UserOrganizationDto[]
}
export type UpdateOrganizationResponse = {
  id: number
}
export type UpdateOrganizationDto = {
  name?: string
  status?: 'ACTIVE'
}
export type CreateOrganizationSafeDto = {
  chainId: string
  address: string
}
export type CreateOrganizationSafesDto = {
  safes: CreateOrganizationSafeDto[]
}
export type GetOrganizationSafeResponse = {
  safes: {
    [key: string]: string[]
  }
}
export type DeleteOrganizationSafeDto = {
  chainId: string
  address: string
}
export type DeleteOrganizationSafesDto = {
  safes: DeleteOrganizationSafeDto[]
}
export type Invitation = {
  userId: number
  orgId: number
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
export type UserOrganizationUser = {
  id: number
  status: 'PENDING' | 'ACTIVE'
}
export type UserOrganization = {
  id: number
  role: 'ADMIN' | 'MEMBER'
  status: 'INVITED' | 'ACTIVE' | 'DECLINED'
  name: string
  invitedBy?: string | null
  createdAt: string
  updatedAt: string
  user: UserOrganizationUser
}
export type UserOrganizationsDto = {
  members: UserOrganization[]
}
export type UpdateRoleDto = {
  role: 'ADMIN' | 'MEMBER'
}
export const {
  useOrganizationsCreateV1Mutation,
  useOrganizationsGetV1Query,
  useLazyOrganizationsGetV1Query,
  useOrganizationsCreateWithUserV1Mutation,
  useOrganizationsGetOneV1Query,
  useLazyOrganizationsGetOneV1Query,
  useOrganizationsUpdateV1Mutation,
  useOrganizationsDeleteV1Mutation,
  useOrganizationSafesCreateV1Mutation,
  useOrganizationSafesGetV1Query,
  useLazyOrganizationSafesGetV1Query,
  useOrganizationSafesDeleteV1Mutation,
  useUserOrganizationsInviteUserV1Mutation,
  useUserOrganizationsAcceptInviteV1Mutation,
  useUserOrganizationsDeclineInviteV1Mutation,
  useUserOrganizationsGetUsersV1Query,
  useLazyUserOrganizationsGetUsersV1Query,
  useUserOrganizationsUpdateRoleV1Mutation,
  useUserOrganizationsRemoveUserV1Mutation,
} = injectedRtkApi
