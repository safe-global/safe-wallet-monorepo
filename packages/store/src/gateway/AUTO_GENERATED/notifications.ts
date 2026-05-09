import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['notifications'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      notificationsRegisterDeviceV1: build.mutation<
        NotificationsRegisterDeviceV1ApiResponse,
        NotificationsRegisterDeviceV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/register/notifications`, method: 'POST', body: queryArg.registerDeviceDto }),
        invalidatesTags: ['notifications'],
      }),
      notificationsUnregisterDeviceV1: build.mutation<
        NotificationsUnregisterDeviceV1ApiResponse,
        NotificationsUnregisterDeviceV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/notifications/devices/${queryArg.uuid}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['notifications'],
      }),
      notificationsUnregisterSafeV1: build.mutation<
        NotificationsUnregisterSafeV1ApiResponse,
        NotificationsUnregisterSafeV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/notifications/devices/${queryArg.uuid}/safes/${queryArg.safeAddress}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['notifications'],
      }),
      notificationsUpsertSubscriptionsV2: build.mutation<
        NotificationsUpsertSubscriptionsV2ApiResponse,
        NotificationsUpsertSubscriptionsV2ApiArg
      >({
        query: (queryArg) => ({
          url: `/v2/register/notifications`,
          method: 'POST',
          body: queryArg.upsertSubscriptionsDto,
        }),
        invalidatesTags: ['notifications'],
      }),
      notificationsGetSafeSubscriptionV2: build.query<
        NotificationsGetSafeSubscriptionV2ApiResponse,
        NotificationsGetSafeSubscriptionV2ApiArg
      >({
        query: (queryArg) => ({
          url: `/v2/chains/${queryArg.chainId}/notifications/devices/${queryArg.deviceUuid}/safes/${queryArg.safeAddress}`,
        }),
        providesTags: ['notifications'],
      }),
      notificationsDeleteSubscriptionV2: build.mutation<
        NotificationsDeleteSubscriptionV2ApiResponse,
        NotificationsDeleteSubscriptionV2ApiArg
      >({
        query: (queryArg) => ({
          url: `/v2/chains/${queryArg.chainId}/notifications/devices/${queryArg.deviceUuid}/safes/${queryArg.safeAddress}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['notifications'],
      }),
      notificationsDeleteAllSubscriptionsV2: build.mutation<
        NotificationsDeleteAllSubscriptionsV2ApiResponse,
        NotificationsDeleteAllSubscriptionsV2ApiArg
      >({
        query: (queryArg) => ({
          url: `/v2/notifications/subscriptions`,
          method: 'DELETE',
          body: queryArg.deleteAllSubscriptionsDto,
        }),
        invalidatesTags: ['notifications'],
      }),
      notificationsDeleteDeviceV2: build.mutation<
        NotificationsDeleteDeviceV2ApiResponse,
        NotificationsDeleteDeviceV2ApiArg
      >({
        query: (queryArg) => ({
          url: `/v2/chains/${queryArg.chainId}/notifications/devices/${queryArg.deviceUuid}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['notifications'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type NotificationsRegisterDeviceV1ApiResponse = unknown
export type NotificationsRegisterDeviceV1ApiArg = {
  /** Device registration data including device token, UUID, and Safe registrations with signatures */
  registerDeviceDto: RegisterDeviceDto
}
export type NotificationsUnregisterDeviceV1ApiResponse = unknown
export type NotificationsUnregisterDeviceV1ApiArg = {
  /** Chain ID (kept for backward compatibility) */
  chainId: string
  /** Device UUID to unregister */
  uuid: string
}
export type NotificationsUnregisterSafeV1ApiResponse = unknown
export type NotificationsUnregisterSafeV1ApiArg = {
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Device UUID */
  uuid: string
  /** Safe contract address (0x prefixed hex string) */
  safeAddress: string
}
export type NotificationsUpsertSubscriptionsV2ApiResponse =
  /** status 201 Device registered successfully with returned device UUID */ {
    /** Generated UUID for the registered device */
    deviceUuid?: string
  }
export type NotificationsUpsertSubscriptionsV2ApiArg = {
  /** Device and subscription data including device token, Safe addresses, and notification preferences */
  upsertSubscriptionsDto: UpsertSubscriptionsDto
}
export type NotificationsGetSafeSubscriptionV2ApiResponse =
  /** status 200 List of notification types the device is subscribed to for this Safe */ NotificationTypeResponseDto[]
export type NotificationsGetSafeSubscriptionV2ApiArg = {
  /** Device UUID */
  deviceUuid: string
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address (0x prefixed hex string) */
  safeAddress: string
}
export type NotificationsDeleteSubscriptionV2ApiResponse = unknown
export type NotificationsDeleteSubscriptionV2ApiArg = {
  /** Device UUID */
  deviceUuid: string
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address (0x prefixed hex string) */
  safeAddress: string
}
export type NotificationsDeleteAllSubscriptionsV2ApiResponse = unknown
export type NotificationsDeleteAllSubscriptionsV2ApiArg = {
  deleteAllSubscriptionsDto: DeleteAllSubscriptionsDto
}
export type NotificationsDeleteDeviceV2ApiResponse = unknown
export type NotificationsDeleteDeviceV2ApiArg = {
  /** Chain ID (kept for backward compatibility) */
  chainId: string
  /** Device UUID to delete */
  deviceUuid: string
}
export type SafeRegistration = {
  chainId: string
  safes: string[]
  signatures: string[]
}
export type RegisterDeviceDto = {
  uuid?: string | null
  cloudMessagingToken: string
  buildNumber: string
  bundle: string
  deviceType: string
  version: string
  timestamp?: string | null
  safeRegistrations: SafeRegistration[]
}
export type NotificationTypeEnum =
  | 'CONFIRMATION_REQUEST'
  | 'DELETED_MULTISIG_TRANSACTION'
  | 'EXECUTED_MULTISIG_TRANSACTION'
  | 'INCOMING_ETHER'
  | 'INCOMING_TOKEN'
  | 'MESSAGE_CONFIRMATION_REQUEST'
  | 'MODULE_TRANSACTION'
export type UpsertSubscriptionsSafesDto = {
  chainId: string
  address: string
  notificationTypes: NotificationTypeEnum[]
}
export type DeviceType = 'ANDROID' | 'IOS' | 'WEB'
export type UpsertSubscriptionsDto = {
  cloudMessagingToken: string
  safes: UpsertSubscriptionsSafesDto[]
  deviceType: DeviceType
  deviceUuid?: string | null
}
export type NotificationTypeResponseDto = {
  /** The notification type name */
  name: NotificationTypeEnum
}
export type DeleteAllSubscriptionItemDto = {
  chainId: string
  deviceUuid: string
  safeAddress: string
  /** Optional signer address filter:
    • Omitted (undefined): Deletes subscriptions regardless of signer address
    • null: Deletes only subscriptions with no signer address
    • Valid address: Deletes only subscriptions with that specific signer address */
  signerAddress?: string | null
}
export type DeleteAllSubscriptionsDto = {
  /** At least one subscription is required */
  subscriptions: DeleteAllSubscriptionItemDto[]
}
export const {
  useNotificationsRegisterDeviceV1Mutation,
  useNotificationsUnregisterDeviceV1Mutation,
  useNotificationsUnregisterSafeV1Mutation,
  useNotificationsUpsertSubscriptionsV2Mutation,
  useNotificationsGetSafeSubscriptionV2Query,
  useLazyNotificationsGetSafeSubscriptionV2Query,
  useNotificationsDeleteSubscriptionV2Mutation,
  useNotificationsDeleteAllSubscriptionsV2Mutation,
  useNotificationsDeleteDeviceV2Mutation,
} = injectedRtkApi
