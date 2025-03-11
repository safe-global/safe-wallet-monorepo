import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['accounts'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      accountsCreateAccountV1: build.mutation<AccountsCreateAccountV1ApiResponse, AccountsCreateAccountV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/accounts`, method: 'POST', body: queryArg.createAccountDto }),
        invalidatesTags: ['accounts'],
      }),
      accountsGetDataTypesV1: build.query<AccountsGetDataTypesV1ApiResponse, AccountsGetDataTypesV1ApiArg>({
        query: () => ({ url: `/v1/accounts/data-types` }),
        providesTags: ['accounts'],
      }),
      accountsGetAccountDataSettingsV1: build.query<
        AccountsGetAccountDataSettingsV1ApiResponse,
        AccountsGetAccountDataSettingsV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/accounts/${queryArg.address}/data-settings` }),
        providesTags: ['accounts'],
      }),
      accountsUpsertAccountDataSettingsV1: build.mutation<
        AccountsUpsertAccountDataSettingsV1ApiResponse,
        AccountsUpsertAccountDataSettingsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/accounts/${queryArg.address}/data-settings`,
          method: 'PUT',
          body: queryArg.upsertAccountDataSettingsDto,
        }),
        invalidatesTags: ['accounts'],
      }),
      accountsGetAccountV1: build.query<AccountsGetAccountV1ApiResponse, AccountsGetAccountV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/accounts/${queryArg.address}` }),
        providesTags: ['accounts'],
      }),
      accountsDeleteAccountV1: build.mutation<AccountsDeleteAccountV1ApiResponse, AccountsDeleteAccountV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/accounts/${queryArg.address}`, method: 'DELETE' }),
        invalidatesTags: ['accounts'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type AccountsCreateAccountV1ApiResponse = /** status 200  */ Account
export type AccountsCreateAccountV1ApiArg = {
  createAccountDto: CreateAccountDto
}
export type AccountsGetDataTypesV1ApiResponse = /** status 200  */ AccountDataType[]
export type AccountsGetDataTypesV1ApiArg = void
export type AccountsGetAccountDataSettingsV1ApiResponse = /** status 200  */ AccountDataSetting[]
export type AccountsGetAccountDataSettingsV1ApiArg = {
  address: string
}
export type AccountsUpsertAccountDataSettingsV1ApiResponse = /** status 200  */ AccountDataSetting[]
export type AccountsUpsertAccountDataSettingsV1ApiArg = {
  address: string
  upsertAccountDataSettingsDto: UpsertAccountDataSettingsDto
}
export type AccountsGetAccountV1ApiResponse = /** status 200  */ Account
export type AccountsGetAccountV1ApiArg = {
  address: string
}
export type AccountsDeleteAccountV1ApiResponse = unknown
export type AccountsDeleteAccountV1ApiArg = {
  address: string
}
export type Account = {
  id: string
  groupId?: string | null
  address: string
  name: string
}
export type CreateAccountDto = {
  address: string
  name: string
}
export type AccountDataType = {
  id: string
  name: string
  description?: string | null
  isActive: boolean
}
export type AccountDataSetting = {
  dataTypeId: string
  enabled: boolean
}
export type UpsertAccountDataSettingDto = {
  dataTypeId: string
  enabled: boolean
}
export type UpsertAccountDataSettingsDto = {
  accountDataSettings: UpsertAccountDataSettingDto[]
}
export const {
  useAccountsCreateAccountV1Mutation,
  useAccountsGetDataTypesV1Query,
  useLazyAccountsGetDataTypesV1Query,
  useAccountsGetAccountDataSettingsV1Query,
  useLazyAccountsGetAccountDataSettingsV1Query,
  useAccountsUpsertAccountDataSettingsV1Mutation,
  useAccountsGetAccountV1Query,
  useLazyAccountsGetAccountV1Query,
  useAccountsDeleteAccountV1Mutation,
} = injectedRtkApi
