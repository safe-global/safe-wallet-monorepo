import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['organizations'] as const
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
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type OrganizationsCreateV1ApiResponse = /** status 200 Organizations created */ CreateOrganizationResponse
export type OrganizationsCreateV1ApiArg = {
  createOrganizationDto: CreateOrganizationDto
}
export type OrganizationsGetV1ApiResponse = /** status 200 Organizations found */ GetOrganizationResponse[]
export type OrganizationsGetV1ApiArg = void
export type OrganizationsCreateWithUserV1ApiResponse =
  /** status 200 Organizations created */ CreateOrganizationResponse
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
export type CreateOrganizationResponse = {
  name: string
  id: number
}
export type CreateOrganizationDto = {
  name: string
}
export type GetOrganizationResponse = {
  id: number
  name: string
  status: 1
  userOrganizations: string[]
}
export type UpdateOrganizationResponse = {
  id: number
}
export type UpdateOrganizationDto = {
  name?: string
  status?: 1
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
} = injectedRtkApi
