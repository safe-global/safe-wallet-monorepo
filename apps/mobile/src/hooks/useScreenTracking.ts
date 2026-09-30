import { useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { usePathname, useGlobalSearchParams } from 'expo-router'
import { trackScreenView, trackDatadogView } from '@/src/services/analytics'
import { stopActiveDatadogView, resumeActiveDatadogView } from '@/src/services/analytics/datadogAnalytics'

export const useScreenTracking = () => {
  const pathname = usePathname()
  const params = useGlobalSearchParams()

  useEffect(() => {
    trackDatadogView(pathname, pathname)
    trackScreenView(pathname, pathname)
  }, [pathname, params])

  // App-lifecycle tracking for Datadog RUM only. Without this, a view left open
  // while the app is in the background stays active, and the JS-thread
  // suspension is recorded as a false `is_frozen_frame` long task on resume.
  // Empty deps is correct: the handler closes over no React state, so it never
  // goes stale and must not re-subscribe.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        stopActiveDatadogView()
      } else if (nextAppState === 'active') {
        resumeActiveDatadogView()
      }
      // 'inactive' (iOS-only transition state) is intentionally ignored — the JS
      // thread is not suspended there. This matches Datadog's own navigation
      // trackers, which only stop on 'background' and start on 'active'.
    })

    return () => subscription.remove()
  }, [])
}
