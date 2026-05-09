import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import Script from 'next/script'
import { useCaptchaToken } from './useCaptchaToken'
import {
  initializeCaptchaHeaders,
  resolveCaptchaReady,
  registerActivateCaptcha,
  isCaptchaActivated,
} from './captchaHeadersInit'
import { useDarkMode } from '@/hooks/useDarkMode'
import { TURNSTILE_SITE_KEY } from '@safe-global/utils/config/constants'
import CaptchaModal from './CaptchaModal'

// Register the CGW header interceptor once at module load time,
// before any requests can be made.
initializeCaptchaHeaders()

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

// Isolated sub-component so useCaptchaToken only runs when the widget is actually needed.
function CaptchaWidget() {
  const isDarkMode = useDarkMode()
  const [isScriptReady, setIsScriptReady] = useState(false)

  const captcha = useCaptchaToken({ theme: isDarkMode ? 'dark' : 'light', isScriptReady })

  return (
    <>
      <Script
        src={TURNSTILE_SCRIPT_URL}
        strategy="afterInteractive"
        onReady={() => setIsScriptReady(true)}
        onError={resolveCaptchaReady}
      />
      <CaptchaModal
        open={captcha.isModalOpen}
        onWidgetContainerReady={captcha.onWidgetContainerReady}
        error={captcha.error}
        onRetry={captcha.refreshToken}
      />
    </>
  )
}

export function CaptchaProvider({ children }: { children: ReactNode }) {
  // Seed from module flag so a remounting provider resumes active state immediately
  const [isActive, setIsActive] = useState(() => isCaptchaActivated())

  useEffect(() => {
    registerActivateCaptcha(() => setIsActive(true))
    return () => registerActivateCaptcha(() => {})
  }, [])

  return (
    <>
      {children}
      {TURNSTILE_SITE_KEY && isActive && <CaptchaWidget />}
    </>
  )
}
