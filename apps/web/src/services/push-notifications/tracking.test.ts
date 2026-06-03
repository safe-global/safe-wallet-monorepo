import { update as updateIndexedDb } from 'idb-keyval'
import type { MessagePayload } from 'firebase/messaging/sw'

import { WebhookType } from '@/service-workers/firebase-messaging/webhook-types'
import { cacheServiceWorkerPushNotificationTrackingEvent, type NotificationTracking } from './tracking'

jest.mock('idb-keyval', () => ({
  createStore: jest.fn(() => ({})),
  update: jest.fn(() => Promise.resolve()),
}))

const mockUpdate = updateIndexedDb as jest.MockedFunction<typeof updateIndexedDb>

type TrackingValue = NotificationTracking[keyof NotificationTracking]

const getUpdater = () => {
  return mockUpdate.mock.calls[0][1] as (prev: TrackingValue | undefined) => TrackingValue
}

describe('cacheServiceWorkerPushNotificationTrackingEvent', () => {
  const data = {
    type: WebhookType.INCOMING_ETHER,
    chainId: '1',
    address: '0x0',
    txHash: '0x1',
    value: '1',
  } as unknown as MessagePayload['data']

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('increments the first shown event to 1', () => {
    cacheServiceWorkerPushNotificationTrackingEvent('shown', data)

    const updater = getUpdater()
    expect(updater(undefined)).toEqual({ shown: 1, opened: 0 })
  })

  it('increments the first opened event to 1', () => {
    cacheServiceWorkerPushNotificationTrackingEvent('opened', data)

    const updater = getUpdater()
    expect(updater(undefined)).toEqual({ shown: 0, opened: 1 })
  })

  it('increments a subsequent event to 2', () => {
    cacheServiceWorkerPushNotificationTrackingEvent('shown', data)

    const updater = getUpdater()
    expect(updater({ shown: 1, opened: 0 })).toEqual({ shown: 2, opened: 0 })
  })

  it('does nothing for non-webhook events', () => {
    cacheServiceWorkerPushNotificationTrackingEvent('shown', {
      type: 'NOT_A_WEBHOOK',
    } as unknown as MessagePayload['data'])

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
