const SAFE_APPS_ANALYTICS_CATEGORY = 'safe-apps-analytics'

export const trackSafeAppEvent = (action: string, label?: string) => {
  window.parent.postMessage(
    {
      category: SAFE_APPS_ANALYTICS_CATEGORY,
      action,
      label,
      safeAppName: 'Transaction Builder',
    },
    '*',
  )
}
