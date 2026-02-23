import 'fake-indexeddb/auto'
import { entries, setMany } from 'idb-keyval'

import * as tracking from '@/services/analytics'
import * as useChains from '@/hooks/useChains'
import { PUSH_NOTIFICATION_EVENTS } from '@/services/analytics/events/push-notifications'
import { createNotificationTrackingIndexedDb } from '@/services/push-notifications/tracking'
import { WebhookType } from '@/service-workers/firebase-messaging/webhook-types'
import { renderHook, waitFor } from '@/tests/test-utils'
import { useNotificationTracking } from '../useNotificationTracking'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

describe('useNotificationTracking', () => {
  beforeEach(() => {
    // Reset indexedDB
    indexedDB = new IDBFactory()
    jest.clearAllMocks()
  })

  it('should not track if the feature flag is disabled', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)
    jest.spyOn(tracking, 'trackEvent')

    renderHook(() => useNotificationTracking())

    expect(tracking.trackEvent).not.toHaveBeenCalled()
  })

  it('should track all cached events and clear the cache', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(tracking, 'trackEvent')

    const cache = {
      [`1:${WebhookType.INCOMING_ETHER}`]: {
        shown: 1,
        opened: 0,
      },
      [`3:${WebhookType.INCOMING_TOKEN}`]: {
        shown: 1,
        opened: 1,
      },
    }

    await setMany(Object.entries(cache), createNotificationTrackingIndexedDb())

    renderHook(() => useNotificationTracking())

    await waitFor(() => {
      expect(tracking.trackEvent).toHaveBeenCalledTimes(3)

      expect(tracking.trackEvent).toHaveBeenCalledWith({
        ...PUSH_NOTIFICATION_EVENTS.SHOW_NOTIFICATION,
        label: WebhookType.INCOMING_ETHER,
        chainId: '1',
      })

      expect(tracking.trackEvent).toHaveBeenCalledWith({
        ...PUSH_NOTIFICATION_EVENTS.SHOW_NOTIFICATION,
        label: WebhookType.INCOMING_TOKEN,
        chainId: '3',
      })

      expect(tracking.trackEvent).toHaveBeenCalledWith({
        ...PUSH_NOTIFICATION_EVENTS.OPEN_NOTIFICATION,
        label: WebhookType.INCOMING_TOKEN,
        chainId: '3',
      })
    })

    const _entries = await entries(createNotificationTrackingIndexedDb())
    expect(Object.fromEntries(_entries)).toEqual({
      [`1:${WebhookType.INCOMING_ETHER}`]: {
        shown: 0,
        opened: 0,
      },
      [`3:${WebhookType.INCOMING_TOKEN}`]: {
        shown: 0,
        opened: 0,
      },
    })
  })

  it('should not track if no cache exists', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(tracking, 'trackEvent')

    const _entries = await entries(createNotificationTrackingIndexedDb())
    expect(_entries).toStrictEqual([])

    renderHook(() => useNotificationTracking())

    expect(tracking.trackEvent).not.toHaveBeenCalled()
  })
})
