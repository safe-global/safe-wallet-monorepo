import { showNotification } from './notifications'

describe('showNotification', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    Object.defineProperty(global, 'Notification', {
      value: jest.fn(),
    })

    Object.assign(global.Notification, {
      permission: 'default',
    })

    jest.spyOn(window, 'focus')
    jest.spyOn(document, 'hasFocus')
  })

  it('should create a notification with the given title and options', () => {
    Object.assign(global.Notification, {
      permission: 'granted',
    })
    ;(document.hasFocus as jest.Mock).mockReturnValue(false)

    const title = 'Test Notification'
    const options = { body: 'Test Body' }

    showNotification(title, options)

    expect(global.Notification).toHaveBeenCalledWith(title, {
      icon: '/images/superchain-logo.png',
      ...options,
    })
  })

  it('should not create a notification if permission is not granted', () => {
    Object.assign(global.Notification, {
      permission: 'denied',
    })
    ;(document.hasFocus as jest.Mock).mockReturnValue(false)

    showNotification('Test Notification')

    expect(global.Notification).not.toHaveBeenCalled()
  })

  it('should not create a notification if the document has focus', () => {
    Object.assign(global.Notification, {
      permission: 'granted',
    })
    ;(document.hasFocus as jest.Mock).mockReturnValue(true)

    showNotification('Test Notification')

    expect(global.Notification).not.toHaveBeenCalled()
  })

  it('should focus the window and close the notification when clicked', () => {
    Object.assign(global.Notification, {
      permission: 'granted',
      close: jest.fn(),
    })
    ;(document.hasFocus as jest.Mock).mockReturnValue(false)

    showNotification('Test Notification')

    const notification = (global.Notification as unknown as jest.Mock).mock.instances[0]

    notification.close = jest.fn()

    notification.onclick()

    expect(window.focus).toHaveBeenCalled()
    expect(notification.close).toHaveBeenCalledTimes(1)
  })

  it('should close the notification after 5 seconds', () => {
    jest.useFakeTimers()
    jest.spyOn(global, 'setTimeout')

    Object.assign(global.Notification, {
      permission: 'granted',
    })
    ;(document.hasFocus as jest.Mock).mockReturnValue(false)

    showNotification('Test Notification')

    const notification = (global.Notification as unknown as jest.Mock).mock.instances[0]
    notification.close = jest.fn()

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000)

    jest.runAllTimers()

    expect(window.focus).not.toHaveBeenCalled()
    expect(notification.close).toHaveBeenCalledTimes(1)
  })
})
