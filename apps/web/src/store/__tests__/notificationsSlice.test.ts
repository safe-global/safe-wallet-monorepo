import {
  notificationsSlice,
  closeNotification,
  deleteAllNotifications,
  readNotification,
  showNotification,
  selectNotifications,
  type Notification,
} from '../notificationsSlice'
import { makeStore } from '@/store'

const createNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: '1',
  message: 'Test notification',
  groupKey: 'test-group',
  variant: 'success',
  timestamp: 1000,
  ...overrides,
})

describe('notificationsSlice', () => {
  const { reducer, actions } = notificationsSlice

  describe('enqueueNotification', () => {
    it('should add a notification', () => {
      const notification = createNotification()
      const state = reducer([], actions.enqueueNotification(notification))

      expect(state).toHaveLength(1)
      expect(state[0]).toEqual(notification)
    })

    it('should append to existing notifications', () => {
      const existing = createNotification({ id: '1' })
      const newNotification = createNotification({ id: '2', message: 'Another' })
      const state = reducer([existing], actions.enqueueNotification(newNotification))

      expect(state).toHaveLength(2)
    })
  })

  describe('closeNotification', () => {
    it('should mark a notification as dismissed', () => {
      const notification = createNotification({ id: '1' })
      const state = reducer([notification], closeNotification({ id: '1' }))

      expect(state[0].isDismissed).toBe(true)
    })

    it('should not affect other notifications', () => {
      const n1 = createNotification({ id: '1' })
      const n2 = createNotification({ id: '2' })
      const state = reducer([n1, n2], closeNotification({ id: '1' }))

      expect(state[0].isDismissed).toBe(true)
      expect(state[1].isDismissed).toBeUndefined()
    })
  })

  describe('closeByGroupKey', () => {
    it('should dismiss all notifications with matching groupKey', () => {
      const n1 = createNotification({ id: '1', groupKey: 'group-a' })
      const n2 = createNotification({ id: '2', groupKey: 'group-a' })
      const n3 = createNotification({ id: '3', groupKey: 'group-b' })
      const state = reducer([n1, n2, n3], actions.closeByGroupKey({ groupKey: 'group-a' }))

      expect(state[0].isDismissed).toBe(true)
      expect(state[1].isDismissed).toBe(true)
      expect(state[2].isDismissed).toBeUndefined()
    })
  })

  describe('deleteNotification', () => {
    it('should remove a notification by id', () => {
      const n1 = createNotification({ id: '1' })
      const n2 = createNotification({ id: '2' })
      const state = reducer([n1, n2], actions.deleteNotification(n1))

      expect(state).toHaveLength(1)
      expect(state[0].id).toBe('2')
    })
  })

  describe('deleteAllNotifications', () => {
    it('should clear all notifications', () => {
      const n1 = createNotification({ id: '1' })
      const n2 = createNotification({ id: '2' })
      const state = reducer([n1, n2], deleteAllNotifications())

      expect(state).toHaveLength(0)
    })
  })

  describe('readNotification', () => {
    it('should mark a notification as read', () => {
      const notification = createNotification({ id: '1' })
      const state = reducer([notification], readNotification({ id: '1' }))

      expect(state[0].isRead).toBe(true)
    })
  })

  describe('showNotification thunk', () => {
    it('should dispatch enqueueNotification with generated id and timestamp', () => {
      const store = makeStore()
      const id = store.dispatch(
        showNotification({
          message: 'Test',
          groupKey: 'test',
          variant: 'info',
        }),
      )

      expect(typeof id).toBe('string')
      const notifications = selectNotifications(store.getState())
      expect(notifications).toHaveLength(1)
      expect(notifications[0].message).toBe('Test')
      expect(notifications[0].id).toBe(id)
      expect(notifications[0].timestamp).toBeGreaterThan(0)
    })
  })
})
