import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['users'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      usersGetWithWalletsV1: build.query<UsersGetWithWalletsV1ApiResponse, UsersGetWithWalletsV1ApiArg>({
        query: () => ({ url: `/v1/users` }),
        providesTags: ['users'],
      }),
      usersDeleteV1: build.mutation<UsersDeleteV1ApiResponse, UsersDeleteV1ApiArg>({
        query: () => ({ url: `/v1/users`, method: 'DELETE' }),
        invalidatesTags: ['users'],
      }),
      usersCreateWithWalletV1: build.mutation<UsersCreateWithWalletV1ApiResponse, UsersCreateWithWalletV1ApiArg>({
        query: () => ({ url: `/v1/users/wallet`, method: 'POST' }),
        invalidatesTags: ['users'],
      }),
      usersAddWalletToUserV1: build.mutation<UsersAddWalletToUserV1ApiResponse, UsersAddWalletToUserV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/users/wallet/add`, method: 'POST', body: queryArg.siweDto }),
        invalidatesTags: ['users'],
      }),
      usersDeleteWalletFromUserV1: build.mutation<
        UsersDeleteWalletFromUserV1ApiResponse,
        UsersDeleteWalletFromUserV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/users/wallet/${queryArg.walletAddress}`, method: 'DELETE' }),
        invalidatesTags: ['users'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type UsersGetWithWalletsV1ApiResponse = /** status 200  */ UserWithWallets
export type UsersGetWithWalletsV1ApiArg = void
export type UsersDeleteV1ApiResponse = unknown
export type UsersDeleteV1ApiArg = void
export type UsersCreateWithWalletV1ApiResponse = /** status 200  */ CreatedUserWithWallet
export type UsersCreateWithWalletV1ApiArg = void
export type UsersAddWalletToUserV1ApiResponse = /** status 200  */ WalletAddedToUser
export type UsersAddWalletToUserV1ApiArg = {
  siweDto: SiweDto
}
export type UsersDeleteWalletFromUserV1ApiResponse = unknown
export type UsersDeleteWalletFromUserV1ApiArg = {
  walletAddress: string
}
export type UserWallet = {
  id: number
  address: string
}
export type UserWithWallets = {
  id: number
  status: 0 | 1
  wallets: UserWallet[]
}
export type CreatedUserWithWallet = {
  id: number
}
export type WalletAddedToUser = {
  id: number
}
export type SiweDto = {
  message: string
  signature: string
}
export const {
  useUsersGetWithWalletsV1Query,
  useLazyUsersGetWithWalletsV1Query,
  useUsersDeleteV1Mutation,
  useUsersCreateWithWalletV1Mutation,
  useUsersAddWalletToUserV1Mutation,
  useUsersDeleteWalletFromUserV1Mutation,
} = injectedRtkApi
