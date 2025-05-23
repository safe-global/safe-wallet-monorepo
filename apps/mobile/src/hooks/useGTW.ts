import {
  getDeviceUuid,
  authenticateSigner,
  registerForNotificationsOnBackEnd,
  unregisterForNotificationsOnBackEnd,
} from '@/src/services/notifications/backend'

export function useGTW() {
  return {
    getDeviceUuid,
    authenticateSigner,
    registerForNotificationsOnBackEnd,
    unregisterForNotificationsOnBackEnd,
  }
}
