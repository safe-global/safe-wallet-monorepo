import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['messages'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      messagesGetMessageByHashV1: build.query<MessagesGetMessageByHashV1ApiResponse, MessagesGetMessageByHashV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/messages/${queryArg.messageHash}` }),
        providesTags: ['messages'],
      }),
      messagesGetMessagesBySafeV1: build.query<
        MessagesGetMessagesBySafeV1ApiResponse,
        MessagesGetMessagesBySafeV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/messages`,
          params: {
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['messages'],
      }),
      messagesCreateMessageV1: build.mutation<MessagesCreateMessageV1ApiResponse, MessagesCreateMessageV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/messages`,
          method: 'POST',
          body: queryArg.createMessageDto,
        }),
        invalidatesTags: ['messages'],
      }),
      messagesUpdateMessageSignatureV1: build.mutation<
        MessagesUpdateMessageSignatureV1ApiResponse,
        MessagesUpdateMessageSignatureV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/messages/${queryArg.messageHash}/signatures`,
          method: 'POST',
          body: queryArg.updateMessageSignatureDto,
        }),
        invalidatesTags: ['messages'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type MessagesGetMessageByHashV1ApiResponse = /** status 200  */ Message
export type MessagesGetMessageByHashV1ApiArg = {
  chainId: string
  messageHash: string
}
export type MessagesGetMessagesBySafeV1ApiResponse = /** status 200  */ MessagePage
export type MessagesGetMessagesBySafeV1ApiArg = {
  chainId: string
  safeAddress: string
  cursor?: string
}
export type MessagesCreateMessageV1ApiResponse = unknown
export type MessagesCreateMessageV1ApiArg = {
  chainId: string
  safeAddress: string
  createMessageDto: CreateMessageDto
}
export type MessagesUpdateMessageSignatureV1ApiResponse = unknown
export type MessagesUpdateMessageSignatureV1ApiArg = {
  chainId: string
  messageHash: string
  updateMessageSignatureDto: UpdateMessageSignatureDto
}
export type TypedDataDomain = {
  chainId?: number
  name?: string
  salt?: string
  verifyingContract?: string
  version?: string
}
export type TypedDataParameter = {
  name: string
  type: string
}
export type TypedData = {
  domain: TypedDataDomain
  primaryType: string
  types: {
    [key: string]: TypedDataParameter[]
  }
  message: {
    [key: string]: any
  }
}
export type AddressInfo = {
  value: string
  name?: string | null
  logoUri?: string | null
}
export type MessageConfirmation = {
  owner: AddressInfo
  signature: string
}
export type Message = {
  messageHash: string
  status: 'NEEDS_CONFIRMATION' | 'CONFIRMED'
  logoUri?: string | null
  name?: string | null
  message: string | TypedData
  creationTimestamp: number
  modifiedTimestamp: number
  confirmationsSubmitted: number
  confirmationsRequired: number
  proposedBy: AddressInfo
  confirmations: MessageConfirmation[]
  preparedSignature?: string | null
  origin?: string | null
}
export type MessageItem = {
  messageHash: string
  status: 'NEEDS_CONFIRMATION' | 'CONFIRMED'
  logoUri?: string | null
  name?: string | null
  message: string | TypedData
  creationTimestamp: number
  modifiedTimestamp: number
  confirmationsSubmitted: number
  confirmationsRequired: number
  proposedBy: AddressInfo
  confirmations: MessageConfirmation[]
  preparedSignature?: string | null
  origin?: string | null
  type: 'MESSAGE'
}
export type DateLabel = {
  type: 'DATE_LABEL'
  timestamp: number
}
export type MessagePage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: (MessageItem | DateLabel)[]
}
export type CreateMessageDto = {
  message: string | TypedData
  safeAppId?: number | null
  signature: string
  origin?: string | null
}
export type UpdateMessageSignatureDto = {
  signature: string
}
export const {
  useMessagesGetMessageByHashV1Query,
  useLazyMessagesGetMessageByHashV1Query,
  useMessagesGetMessagesBySafeV1Query,
  useLazyMessagesGetMessagesBySafeV1Query,
  useMessagesCreateMessageV1Mutation,
  useMessagesUpdateMessageSignatureV1Mutation,
} = injectedRtkApi
