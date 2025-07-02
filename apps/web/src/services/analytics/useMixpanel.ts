import { useEffect } from 'react'
import mixpanel from 'mixpanel-browser'
import { IS_PRODUCTION } from '@/config/constants'

/**
 * Initializes Mixpanel analytics for the web app.
 * Should be called once at app startup.
 */
const useMixpanel = () => {
  useEffect(() => {
    // Only initialize in the browser
    if (typeof window === 'undefined') return
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
    if (!token) return
    mixpanel.init(token, { debug: !IS_PRODUCTION })
  }, [])
}

export default useMixpanel
