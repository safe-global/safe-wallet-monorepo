import { useEffect } from 'react'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { HYPERNATIVE_OAUTH_CONFIG } from '../config/oauth'
import {
  AUTH_COOKIE_CHANGE_EVENT,
  clearAuthCookie,
  getAuthCookieData,
  markRefreshAbandoned,
} from '../store/cookieStorage'
import {
  getNextRefreshStep,
  getRefreshDelayMs,
  refreshAuthToken,
  type ExchangeRefreshToken,
} from '../services/tokenRefresh'

/**
 * Keeps the Hypernative access token fresh with the refresh token from the auth cookie.
 * Mount it once per app: every mounted copy runs its own refresh loop.
 */
export const useHypernativeTokenRefresh = (): void => {
  const [exchangeToken] = hypernativeApi.useExchangeTokenMutation()

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let isBusy = false
    let isUnmounted = false

    const exchange: ExchangeRefreshToken = (refreshToken) =>
      exchangeToken({
        grant_type: 'refresh_token',
        client_id: HYPERNATIVE_OAUTH_CONFIG.clientId,
        refresh_token: refreshToken,
      }).unwrap()

    const runAfter = (delayMs: number, task: () => void) => {
      clearTimeout(timer)
      timer = setTimeout(task, delayMs)
    }

    const attemptRefresh = async (refreshToken: string, attempt: number) => {
      isBusy = true
      const outcome = await refreshAuthToken(refreshToken, exchange)
      if (isUnmounted) {
        return
      }

      const step = getNextRefreshStep(outcome, attempt, navigator.onLine)
      if (step.type === 'retry') {
        runAfter(step.delayMs, () => attemptRefresh(refreshToken, attempt + 1))
        return
      }

      isBusy = false
      if (step.type === 'sign-out') {
        clearAuthCookie()
      } else if (step.type === 'abandon') {
        markRefreshAbandoned(refreshToken)
      } else if (step.type === 'done') {
        scheduleRefresh()
      }
    }

    const scheduleRefresh = () => {
      if (isBusy) {
        return
      }
      const data = getAuthCookieData()
      const refreshToken = data?.refreshToken
      if (!refreshToken || data.refreshAbandoned) {
        clearTimeout(timer)
        return
      }
      runAfter(getRefreshDelayMs(data.expiry, Date.now()), () => attemptRefresh(refreshToken, 0))
    }

    // Timers can stall while the device sleeps, so re-check whenever the app comes back
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleRefresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', scheduleRefresh)
    window.addEventListener('online', scheduleRefresh)
    window.addEventListener(AUTH_COOKIE_CHANGE_EVENT, scheduleRefresh)
    scheduleRefresh()

    return () => {
      isUnmounted = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', scheduleRefresh)
      window.removeEventListener('online', scheduleRefresh)
      window.removeEventListener(AUTH_COOKIE_CHANGE_EVENT, scheduleRefresh)
    }
  }, [exchangeToken])
}
