import type { AppInfo } from '.'

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission !== 'granted' || document.hasFocus()) {
    return
  }

  const notification = new Notification(title, {
    icon: '/images/superchain-logo.png',
    ...options,
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }

  setTimeout(() => {
    notification.close()
  }, 5_000)
}

export const NotificationMessages: Record<
  string,
  (appInfo: AppInfo) => { title: string; options: NotificationOptions }
> = {
  SIGNATURE_REQUEST: (appInfo: AppInfo) => ({
    title: 'Signature request',
    options: {
      body: `${appInfo.name} wants you to sign a message. Open the SuperChain SA to continue.`,
    },
  }),
  TRANSACTION_REQUEST: (appInfo: AppInfo) => ({
    title: 'Transaction request',
    options: {
      body: `${appInfo.name} wants to submit a transaction. Open the SuperChain SA to continue.`,
    },
  }),
}
