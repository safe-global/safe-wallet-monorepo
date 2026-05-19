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
      userAddressBookGetPrivateItemsV1: build.query<
        UserAddressBookGetPrivateItemsV1ApiResponse,
        UserAddressBookGetPrivateItemsV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/spaces/${queryArg.spaceId}/address-book/private` }),
        providesTags: ['spaces'],
      }),
      userAddressBookUpsertPrivateItemsV1: build.mutation<
        UserAddressBookUpsertPrivateItemsV1ApiResponse,
        UserAddressBookUpsertPrivateItemsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/address-book/private`,
          method: 'PUT',
          body: queryArg.upsertAddressBookItemsDto,
        }),
        invalidatesTags: ['spaces'],
      }),
      userAddressBookDeletePrivateItemV1: build.mutation<
        UserAddressBookDeletePrivateItemV1ApiResponse,
        UserAddressBookDeletePrivateItemV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/address-book/private/${queryArg.address}`,
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
      spaceTransactionsGetTransactionQueueV1: build.query<
        SpaceTransactionsGetTransactionQueueV1ApiResponse,
        SpaceTransactionsGetTransactionQueueV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/spaces/${queryArg.spaceId}/transactions/queued`,
          params: {
            cursor: queryArg.cursor,
          },
        }),
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
export type UserAddressBookGetPrivateItemsV1ApiResponse =
  /** status 200 Private address book items retrieved successfully */ UserAddressBookDto
export type UserAddressBookGetPrivateItemsV1ApiArg = {
  /** Space ID */
  spaceId: number
}
export type UserAddressBookUpsertPrivateItemsV1ApiResponse =
  /** status 200 Private address book updated successfully */ UserAddressBookDto
export type UserAddressBookUpsertPrivateItemsV1ApiArg = {
  /** Space ID */
  spaceId: number
  /** Address book items to create or update */
  upsertAddressBookItemsDto: UpsertAddressBookItemsDto
}
export type UserAddressBookDeletePrivateItemV1ApiResponse = unknown
export type UserAddressBookDeletePrivateItemV1ApiArg = {
  /** Space ID */
  spaceId: number
  /** Address to remove (0x prefixed) */
  address: string
}
export type AddressBookRequestsGetPendingRequestsV1ApiResponse =
  /** status 200 Pending requests retrieved successfully */ AddressBookRequestsDto
export type AddressBookRequestsGetPendingRequestsV1ApiArg = {
  /** Space ID */
  spaceId: number
}
export type AddressBookRequestsCreateRequestV1ApiResponse =
  /** status 201 Request created successfully */ AddressBookRequestItemDto
export type AddressBookRequestsCreateRequestV1ApiArg = {
  /** Space ID */
  spaceId: number
  /** Address of the private contact to request adding */
  createAddressBookRequestDto: CreateAddressBookRequestDto
}
export type AddressBookRequestsApproveRequestV1ApiResponse = unknown
export type AddressBookRequestsApproveRequestV1ApiArg = {
  /** Space ID */
  spaceId: number
  /** Request ID to approve */
  requestId: number
}
export type AddressBookRequestsRejectRequestV1ApiResponse = unknown
export type AddressBookRequestsRejectRequestV1ApiArg = {
  /** Space ID */
  spaceId: number
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
export type SpacesCreateWithUserV1ApiResponse = /** status 200 Space created successfully */ CreateSpaceResponse
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
export type SpaceTransactionsGetTransactionQueueV1ApiResponse =
  /** status 200 Paginated list of queued transactions for the space */ QueuedItemPage
export type SpaceTransactionsGetTransactionQueueV1ApiArg = {
  /** Pagination cursor for retrieving the next set of results */
  cursor?: string
  /** Space ID to fetch queued transactions for */
  spaceId: number
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
export type MembersGetMembershipV1ApiResponse = /** status 200 Membership retrieved successfully */ MemberDto
export type MembersGetMembershipV1ApiArg = {
  /** Space ID to fetch the caller's membership for */
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
export type UserAddressBookItemDto = {
  name: string
  address: string
  chainIds: string[]
  createdBy: string
  createdAt: object
  updatedAt: object
}
export type UserAddressBookDto = {
  spaceId: string
  data: UserAddressBookItemDto[]
}
export type AddressBookRequestItemDto = {
  id: number
  name: string
  address: string
  chainIds: string[]
  requestedBy: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
}
export type AddressBookRequestsDto = {
  spaceId: string
  data: AddressBookRequestItemDto[]
}
export type CreateAddressBookRequestDto = {
  /** Address of the private contact to request adding to space */
  address: string
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
export type SpaceMemberDto = {
  role: 'ADMIN' | 'MEMBER'
  name: string
  invitedBy: string
  status: 'INVITED' | 'ACTIVE' | 'DECLINED'
  user: UserDto
}
export type GetSpaceResponse = {
  id: number
  name: string
  members: SpaceMemberDto[]
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
export type ConflictHeaderQueuedItem = {
  type: 'CONFLICT_HEADER'
  nonce: number
}
export type LabelQueuedItem = {
  type: 'LABEL'
  label: string
}
export type AddressInfo = {
  value: string
  name?: string | null
  logoUri?: string | null
}
export type CreationTransactionInfo = {
  type: 'Creation'
  humanDescription?: string | null
  creator: AddressInfo
  transactionHash: string
  implementation?: AddressInfo | null
  factory?: AddressInfo
  saltNonce?: string | null
}
export type CustomTransactionInfo = {
  type: 'Custom'
  humanDescription?: string | null
  to: AddressInfo
  dataSize: string
  value?: string | null
  isCancellation: boolean
  methodName?: string | null
}
export type MultiSendTransactionInfo = {
  type: 'Custom'
  humanDescription?: string | null
  to: AddressInfo
  dataSize: string
  value?: string | null
  isCancellation: boolean
  methodName: 'multiSend'
  actionCount: number
}
export type BaseDataDecoded = {
  method: string
  parameters?: DataDecodedParameter[]
}
export type Operation = 0 | 1
export type MultiSend = {
  /** Operation type: 0 for CALL, 1 for DELEGATE */
  operation: Operation
  value: string
  dataDecoded?: BaseDataDecoded
  to: string
  /** Hexadecimal encoded data */
  data: string | null
}
export type DataDecodedParameter = {
  name: string
  type: string
  /** Parameter value - typically a string, but may be an array of strings for array types (e.g., address[], uint256[]) */
  value: string | string[]
  valueDecoded?: BaseDataDecoded | MultiSend[] | null
}
export type DataDecoded = {
  method: string
  parameters?: DataDecodedParameter[] | null
  accuracy?: 'FULL_MATCH' | 'PARTIAL_MATCH' | 'ONLY_FUNCTION_MATCH' | 'NO_MATCH' | 'UNKNOWN'
}
export type AddOwner = {
  type: 'ADD_OWNER'
  owner: AddressInfo
  threshold: number
}
export type ChangeMasterCopy = {
  type: 'CHANGE_MASTER_COPY'
  implementation: AddressInfo
}
export type ChangeThreshold = {
  type: 'CHANGE_THRESHOLD'
  threshold: number
}
export type DeleteGuard = {
  type: 'DELETE_GUARD'
}
export type DisableModule = {
  type: 'DISABLE_MODULE'
  module: AddressInfo
}
export type EnableModule = {
  type: 'ENABLE_MODULE'
  module: AddressInfo
}
export type RemoveOwner = {
  type: 'REMOVE_OWNER'
  owner: AddressInfo
  threshold: number
}
export type SetFallbackHandler = {
  type: 'SET_FALLBACK_HANDLER'
  handler: AddressInfo
}
export type SetGuard = {
  type: 'SET_GUARD'
  guard: AddressInfo
}
export type SwapOwner = {
  type: 'SWAP_OWNER'
  oldOwner: AddressInfo
  newOwner: AddressInfo
}
export type SettingsChangeTransaction = {
  type: 'SettingsChange'
  humanDescription?: string | null
  dataDecoded: DataDecoded
  settingsInfo:
    | AddOwner
    | ChangeMasterCopy
    | ChangeThreshold
    | DeleteGuard
    | DisableModule
    | EnableModule
    | RemoveOwner
    | SetFallbackHandler
    | SetGuard
    | SwapOwner
}
export type Erc20Transfer = {
  type: 'ERC20'
  tokenAddress: string
  value: string
  tokenName?: string | null
  tokenSymbol?: string | null
  logoUri?: string | null
  decimals?: number | null
  trusted?: boolean | null
  imitation: boolean
}
export type Erc721Transfer = {
  type: 'ERC721'
  tokenAddress: string
  tokenId: string
  tokenName?: string | null
  tokenSymbol?: string | null
  logoUri?: string | null
  trusted?: boolean | null
}
export type NativeCoinTransfer = {
  type: 'NATIVE_COIN'
  value?: string | null
}
export type TransferTransactionInfo = {
  type: 'Transfer'
  humanDescription?: string | null
  sender: AddressInfo
  recipient: AddressInfo
  direction: 'INCOMING' | 'OUTGOING' | 'UNKNOWN'
  transferInfo: Erc20Transfer | Erc721Transfer | NativeCoinTransfer
}
export type TokenInfo = {
  /** The token address */
  address: string
  /** The token decimals */
  decimals: number
  /** The logo URI for the token */
  logoUri?: string | null
  /** The token name */
  name: string
  /** The token symbol */
  symbol: string
  /** The token trusted status */
  trusted: boolean
}
export type SwapOrderTransactionInfo = {
  type: 'SwapOrder'
  humanDescription?: string | null
  /** The order UID */
  uid: string
  status: 'presignaturePending' | 'open' | 'fulfilled' | 'cancelled' | 'expired' | 'unknown'
  kind: 'buy' | 'sell' | 'unknown'
  orderClass: 'market' | 'limit' | 'liquidity' | 'unknown'
  /** The timestamp when the order expires */
  validUntil: number
  /** The sell token raw amount (no decimals) */
  sellAmount: string
  /** The buy token raw amount (no decimals) */
  buyAmount: string
  /** The executed sell token raw amount (no decimals) */
  executedSellAmount: string
  /** The executed buy token raw amount (no decimals) */
  executedBuyAmount: string
  /** The sell token of the order */
  sellToken: TokenInfo
  /** The buy token of the order */
  buyToken: TokenInfo
  /** The URL to the explorer page of the order */
  explorerUrl: string
  /** The amount of fees paid for this order. */
  executedFee: string
  /** The token in which the fee was paid, expressed by SURPLUS tokens (BUY tokens for SELL orders and SELL tokens for BUY orders). */
  executedFeeToken: TokenInfo
  /** The (optional) address to receive the proceeds of the trade */
  receiver?: string | null
  owner: string
  /** The App Data for this order */
  fullAppData?: object | null
}
export type BridgeFee = {
  tokenAddress: string
  integratorFee: string
  lifiFee: string
}
export type BridgeAndSwapTransactionInfo = {
  type: 'SwapAndBridge'
  humanDescription?: string | null
  fromToken: TokenInfo
  recipient: AddressInfo
  explorerUrl: string | null
  status: 'NOT_FOUND' | 'INVALID' | 'PENDING' | 'DONE' | 'FAILED' | 'UNKNOWN' | 'AWAITING_EXECUTION'
  substatus:
    | 'WAIT_SOURCE_CONFIRMATIONS'
    | 'WAIT_DESTINATION_TRANSACTION'
    | 'BRIDGE_NOT_AVAILABLE'
    | 'CHAIN_NOT_AVAILABLE'
    | 'REFUND_IN_PROGRESS'
    | 'UNKNOWN_ERROR'
    | 'COMPLETED'
    | 'PARTIAL'
    | 'REFUNDED'
    | 'INSUFFICIENT_ALLOWANCE'
    | 'INSUFFICIENT_BALANCE'
    | 'OUT_OF_GAS'
    | 'EXPIRED'
    | 'SLIPPAGE_EXCEEDED'
    | 'UNKNOWN_FAILED_ERROR'
    | 'UNKNOWN'
    | 'AWAITING_EXECUTION'
  fees: BridgeFee | null
  fromAmount: string
  toChain: string
  toToken: TokenInfo | null
  toAmount: string | null
}
export type SwapTransactionInfo = {
  type: 'Swap'
  humanDescription?: string | null
  recipient: AddressInfo
  fees: BridgeFee | null
  fromToken: TokenInfo
  fromAmount: string
  toToken: TokenInfo
  toAmount: string
  lifiExplorerUrl: string | null
}
export type SwapTransferTransactionInfo = {
  type: 'SwapTransfer'
  humanDescription?: string | null
  sender: AddressInfo
  recipient: AddressInfo
  direction: string
  transferInfo: Erc20Transfer | Erc721Transfer | NativeCoinTransfer
  /** The order UID */
  uid: string
  status: 'presignaturePending' | 'open' | 'fulfilled' | 'cancelled' | 'expired' | 'unknown'
  kind: 'buy' | 'sell' | 'unknown'
  orderClass: 'market' | 'limit' | 'liquidity' | 'unknown'
  /** The timestamp when the order expires */
  validUntil: number
  /** The sell token raw amount (no decimals) */
  sellAmount: string
  /** The buy token raw amount (no decimals) */
  buyAmount: string
  /** The executed sell token raw amount (no decimals) */
  executedSellAmount: string
  /** The executed buy token raw amount (no decimals) */
  executedBuyAmount: string
  /** The sell token of the order */
  sellToken: TokenInfo
  /** The buy token of the order */
  buyToken: TokenInfo
  /** The URL to the explorer page of the order */
  explorerUrl: string
  /** The amount of fees paid for this order. */
  executedFee: string
  /** The token in which the fee was paid, expressed by SURPLUS tokens (BUY tokens for SELL orders and SELL tokens for BUY orders). */
  executedFeeToken: TokenInfo
  /** The (optional) address to receive the proceeds of the trade */
  receiver?: string | null
  owner: string
  /** The App Data for this order */
  fullAppData?: object | null
}
export type DurationAuto = {
  durationType: 'AUTO'
}
export type DurationLimit = {
  durationType: 'LIMIT_DURATION'
  duration: string
}
export type StartTimeAtMining = {
  startType: 'AT_MINING_TIME'
}
export type StartTimeAtEpoch = {
  startType: 'AT_EPOCH'
  epoch: number
}
export type TwapOrderTransactionInfo = {
  type: 'TwapOrder'
  humanDescription?: string | null
  /** The TWAP status */
  status: 'presignaturePending' | 'open' | 'fulfilled' | 'cancelled' | 'expired' | 'unknown'
  kind: 'buy' | 'sell' | 'unknown'
  class?: 'market' | 'limit' | 'liquidity' | 'unknown'
  /** The order UID of the active order, or null if none is active */
  activeOrderUid?: string | null
  /** The timestamp when the TWAP expires */
  validUntil: number
  /** The sell token raw amount (no decimals) */
  sellAmount: string
  /** The buy token raw amount (no decimals) */
  buyAmount: string
  /** The executed sell token raw amount (no decimals), or null if there are too many parts */
  executedSellAmount?: string | null
  /** The executed buy token raw amount (no decimals), or null if there are too many parts */
  executedBuyAmount?: string | null
  /** The executed surplus fee raw amount (no decimals), or null if there are too many parts */
  executedFee?: string | null
  /** The token in which the fee was paid, expressed by SURPLUS tokens (BUY tokens for SELL orders and SELL tokens for BUY orders). */
  executedFeeToken: TokenInfo
  /** The sell token of the TWAP */
  sellToken: TokenInfo
  /** The buy token of the TWAP */
  buyToken: TokenInfo
  /** The address to receive the proceeds of the trade */
  receiver: string
  owner: string
  /** The App Data for this TWAP */
  fullAppData?: object | null
  /** The number of parts in the TWAP */
  numberOfParts: string
  /** The amount of sellToken to sell in each part */
  partSellAmount: string
  /** The amount of buyToken that must be bought in each part */
  minPartLimit: string
  /** The duration of the TWAP interval */
  timeBetweenParts: number
  /** Whether the TWAP is valid for the entire interval or not */
  durationOfPart: DurationAuto | DurationLimit
  /** The start time of the TWAP */
  startTime: StartTimeAtMining | StartTimeAtEpoch
}
export type NativeStakingDepositTransactionInfo = {
  type: 'NativeStakingDeposit'
  humanDescription?: string | null
  status:
    | 'NOT_STAKED'
    | 'ACTIVATING'
    | 'DEPOSIT_IN_PROGRESS'
    | 'ACTIVE'
    | 'EXIT_REQUESTED'
    | 'EXITING'
    | 'EXITED'
    | 'SLASHED'
  estimatedEntryTime: number
  estimatedExitTime: number
  estimatedWithdrawalTime: number
  fee: number
  monthlyNrr: number
  annualNrr: number
  value: string
  numValidators: number
  expectedAnnualReward: string
  expectedMonthlyReward: string
  expectedFiatAnnualReward: number
  expectedFiatMonthlyReward: number
  tokenInfo: TokenInfo
  /** Populated after transaction has been executed */
  validators?: string[] | null
}
export type NativeStakingValidatorsExitTransactionInfo = {
  type: 'NativeStakingValidatorsExit'
  humanDescription?: string | null
  status:
    | 'NOT_STAKED'
    | 'ACTIVATING'
    | 'DEPOSIT_IN_PROGRESS'
    | 'ACTIVE'
    | 'EXIT_REQUESTED'
    | 'EXITING'
    | 'EXITED'
    | 'SLASHED'
  estimatedExitTime: number
  estimatedWithdrawalTime: number
  value: string
  numValidators: number
  tokenInfo: TokenInfo
  validators: string[]
}
export type NativeStakingWithdrawTransactionInfo = {
  type: 'NativeStakingWithdraw'
  humanDescription?: string | null
  value: string
  tokenInfo: TokenInfo
  validators: string[]
}
export type VaultInfo = {
  address: string
  name: string
  description: string
  dashboardUri?: string | null
  logoUri: string
}
export type VaultExtraReward = {
  tokenInfo: TokenInfo
  nrr: number
  claimable: string
  claimableNext: string
}
export type VaultDepositTransactionInfo = {
  type: 'VaultDeposit'
  humanDescription?: string | null
  value: string
  baseNrr: number
  fee: number
  tokenInfo: TokenInfo
  vaultInfo: VaultInfo
  currentReward: string
  additionalRewardsNrr: number
  additionalRewards: VaultExtraReward[]
  expectedMonthlyReward: string
  expectedAnnualReward: string
}
export type VaultRedeemTransactionInfo = {
  type: 'VaultRedeem'
  humanDescription?: string | null
  value: string
  baseNrr: number
  fee: number
  tokenInfo: TokenInfo
  vaultInfo: VaultInfo
  currentReward: string
  additionalRewardsNrr: number
  additionalRewards: VaultExtraReward[]
}
export type MultisigExecutionInfo = {
  type: 'MULTISIG'
  nonce: number
  confirmationsRequired: number
  confirmationsSubmitted: number
  missingSigners?: AddressInfo[] | null
}
export type ModuleExecutionInfo = {
  type: 'MODULE'
  address: AddressInfo
}
export type SafeAppInfo = {
  name: string
  url: string
  logoUri?: string | null
}
export type Transaction = {
  txInfo:
    | CreationTransactionInfo
    | CustomTransactionInfo
    | MultiSendTransactionInfo
    | SettingsChangeTransaction
    | TransferTransactionInfo
    | SwapOrderTransactionInfo
    | BridgeAndSwapTransactionInfo
    | SwapTransactionInfo
    | SwapTransferTransactionInfo
    | TwapOrderTransactionInfo
    | NativeStakingDepositTransactionInfo
    | NativeStakingValidatorsExitTransactionInfo
    | NativeStakingWithdrawTransactionInfo
    | VaultDepositTransactionInfo
    | VaultRedeemTransactionInfo
  id: string
  txHash?: string | null
  timestamp: number
  txStatus: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'AWAITING_CONFIRMATIONS' | 'AWAITING_EXECUTION'
  executionInfo?: (MultisigExecutionInfo | ModuleExecutionInfo) | null
  safeAppInfo?: SafeAppInfo | null
  note?: string | null
}
export type TransactionQueuedItem = {
  type: 'TRANSACTION'
  transaction: Transaction
  conflictType: 'None' | 'HasNext' | 'End'
}
export type QueuedItemPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: (ConflictHeaderQueuedItem | LabelQueuedItem | TransactionQueuedItem)[]
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
  email: string | null
}
export type MemberDto = {
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
  members: MemberDto[]
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
  useUserAddressBookGetPrivateItemsV1Query,
  useLazyUserAddressBookGetPrivateItemsV1Query,
  useUserAddressBookUpsertPrivateItemsV1Mutation,
  useUserAddressBookDeletePrivateItemV1Mutation,
  useAddressBookRequestsGetPendingRequestsV1Query,
  useLazyAddressBookRequestsGetPendingRequestsV1Query,
  useAddressBookRequestsCreateRequestV1Mutation,
  useAddressBookRequestsApproveRequestV1Mutation,
  useAddressBookRequestsRejectRequestV1Mutation,
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
  useSpaceTransactionsGetTransactionQueueV1Query,
  useLazySpaceTransactionsGetTransactionQueueV1Query,
  useMembersInviteUserV1Mutation,
  useMembersAcceptInviteV1Mutation,
  useMembersDeclineInviteV1Mutation,
  useMembersGetUsersV1Query,
  useLazyMembersGetUsersV1Query,
  useMembersSelfRemoveV1Mutation,
  useMembersGetMembershipV1Query,
  useLazyMembersGetMembershipV1Query,
  useMembersUpdateRoleV1Mutation,
  useMembersUpdateAliasV1Mutation,
  useMembersRemoveUserV1Mutation,
} = injectedRtkApi
