import 'fake-indexeddb/auto'
import { entries, setMany } from 'idb-keyval'

import * as tracking from '@/services/analytics'
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

  it('should track all cached events and clear the cache', async () => {
    jest.spyOn(tracking, 'trackEvent')

    const cache = {
      [`1:${WebhookType.INCOMING_ETHER}`]: {
        shown: 1,
        opened: 0,
      },
      [`2:${WebhookType.OUTGOING_ETHER}`]: {
        shown: 0,
        opened: 1,
      },
      [`3:${WebhookType.INCOMING_TOKEN}`]: {
        shown: 1,
        opened: 1,
      },
      [`137:${WebhookType.OUTGOING_TOKEN}`]: {
        shown: 0,
        opened: 0,
      },
    }

    await setMany(Object.entries(cache), createNotificationTrackingIndexedDb())

    renderHook(() => useNotificationTracking())

    await waitFor(() => {
      expect(tracking.trackEvent).toHaveBeenCalledTimes(4)

      expect(tracking.trackEvent).toHaveBeenCalledWith({
        ...PUSH_NOTIFICATION_EVENTS.SHOW_NOTIFICATION,
        label: WebhookType.INCOMING_ETHER,
        chainId: '1',
      })

      expect(tracking.trackEvent).toHaveBeenCalledWith({
        ...PUSH_NOTIFICATION_EVENTS.OPEN_NOTIFICATION,
        label: WebhookType.OUTGOING_ETHER,
        chainId: '2',
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
    expect(Object.fromEntries(_entries)).toStrictEqual({
      [`1:${WebhookType.INCOMING_ETHER}`]: {
        shown: 0,
        opened: 0,
      },
      [`2:${WebhookType.OUTGOING_ETHER}`]: {
        shown: 0,
        opened: 0,
      },
      [`3:${WebhookType.INCOMING_TOKEN}`]: {
        shown: 0,
        opened: 0,
      },
      [`137:${WebhookType.OUTGOING_TOKEN}`]: {
        shown: 0,
        opened: 0,
      },
    })
  })

  it('should not track if no cache exists', async () => {
    jest.spyOn(tracking, 'trackEvent')

    const _entries = await entries(createNotificationTrackingIndexedDb())
    expect(_entries).toStrictEqual([])

    renderHook(() => useNotificationTracking())

    expect(tracking.trackEvent).not.toHaveBeenCalled()
  })
})
