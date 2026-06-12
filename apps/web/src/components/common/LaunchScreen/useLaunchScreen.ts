import { useEffect, useState } from 'react'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'

/** Minimum time the launch screen stays up, so it doesn't flicker on fast/cached loads. */
export const MIN_DISPLAY_MS = 700
/** Hard cap so a failed or hanging chains-config request can never trap the user behind the splash. */
export const MAX_DISPLAY_MS = 10_000

/**
 * Drives the app-boot launch screen.
 *
 * Visible from first mount until the app shell is ready — i.e. the chains
 * config query has settled (the same signal `useIsRequireLoginEnabled` waits
 * on) AND a minimum display time has elapsed — or until a safety timeout
 * fires. One-way: once hidden it never returns, so client-side navigations
 * after boot don't replay it (`_app` only mounts this once per hard load).
 */
export const useLaunchScreen = (): { visible: boolean } => {
  const { isSuccess, isError } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)
  const appReady = isSuccess || isError

  const [visible, setVisible] = useState(true)
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    const minTimer = setTimeout(() => setMinElapsed(true), MIN_DISPLAY_MS)
    const maxTimer = setTimeout(() => setVisible(false), MAX_DISPLAY_MS)
    return () => {
      clearTimeout(minTimer)
      clearTimeout(maxTimer)
    }
  }, [])

  useEffect(() => {
    if (appReady && minElapsed) {
      setVisible(false)
    }
  }, [appReady, minElapsed])

  return { visible }
}
