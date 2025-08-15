import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['positions'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      positionsGetPositionsV1: build.query<PositionsGetPositionsV1ApiResponse, PositionsGetPositionsV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/positions/${queryArg.fiatCode}`,
        }),
        providesTags: ['positions'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type PositionsGetPositionsV1ApiResponse = /** status 200  */ Protocol[]
export type PositionsGetPositionsV1ApiArg = {
  chainId: string
  safeAddress: string
  fiatCode: string
}
export type ProtocolIcon = {
  url: string | null
}
export type ProtocolMetadata = {
  name: string
  icon: ProtocolIcon
}
export type NativeToken = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  type: 'NATIVE_TOKEN'
}
export type Erc20Token = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  type: 'ERC20'
}
export type Erc721Token = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  type: 'ERC721'
}
export type Position = {
  balance: string
  fiatBalance: string
  fiatConversion: string
  tokenInfo: NativeToken | Erc20Token | Erc721Token
  fiatBalance24hChange: string | null
  position_type:
    | ('deposit' | 'loan' | 'locked' | 'staked' | 'reward' | 'wallet' | 'airdrop' | 'margin' | 'unknown')
    | null
}
export type PositionGroup = {
  name: string
  items: Position[]
}
export type Protocol = {
  protocol: string
  protocol_metadata: ProtocolMetadata
  fiatTotal: string
  items: PositionGroup[]
}
export const { usePositionsGetPositionsV1Query, useLazyPositionsGetPositionsV1Query } = injectedRtkApi
