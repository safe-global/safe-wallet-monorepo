import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['notifications'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
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
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type NotificationsUpsertSubscriptionsV2ApiResponse = unknown
export type NotificationsUpsertSubscriptionsV2ApiArg = {
  upsertSubscriptionsDto: UpsertSubscriptionsDto
}
export type NotificationsGetSafeSubscriptionV2ApiResponse = unknown
export type NotificationsGetSafeSubscriptionV2ApiArg = {
  deviceUuid: string
  chainId: string
  safeAddress: string
}
export type NotificationsDeleteSubscriptionV2ApiResponse = unknown
export type NotificationsDeleteSubscriptionV2ApiArg = {
  deviceUuid: string
  chainId: string
  safeAddress: string
}
export type NotificationsDeleteDeviceV2ApiResponse = unknown
export type NotificationsDeleteDeviceV2ApiArg = {
  chainId: string
  deviceUuid: string
}
export type NotificationsRegisterDeviceV1ApiResponse = unknown
export type NotificationsRegisterDeviceV1ApiArg = {
  registerDeviceDto: RegisterDeviceDto
}
export type NotificationsUnregisterDeviceV1ApiResponse = unknown
export type NotificationsUnregisterDeviceV1ApiArg = {
  chainId: string
  uuid: string
}
export type NotificationsUnregisterSafeV1ApiResponse = unknown
export type NotificationsUnregisterSafeV1ApiArg = {
  chainId: string
  uuid: string
  safeAddress: string
}
export type NotificationType =
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
  notificationTypes: NotificationType[]
}
export type DeviceType = 'ANDROID' | 'IOS' | 'WEB'
export type UpsertSubscriptionsDto = {
  cloudMessagingToken: string
  safes: UpsertSubscriptionsSafesDto[]
  deviceType: DeviceType
  deviceUuid?: string | null
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
export const {
  useNotificationsUpsertSubscriptionsV2Mutation,
  useNotificationsGetSafeSubscriptionV2Query,
  useLazyNotificationsGetSafeSubscriptionV2Query,
  useNotificationsDeleteSubscriptionV2Mutation,
  useNotificationsDeleteDeviceV2Mutation,
  useNotificationsRegisterDeviceV1Mutation,
  useNotificationsUnregisterDeviceV1Mutation,
  useNotificationsUnregisterSafeV1Mutation,
} = injectedRtkApi
