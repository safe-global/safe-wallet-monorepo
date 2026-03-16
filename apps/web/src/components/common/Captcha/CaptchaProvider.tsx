import type { ReactNode } from 'react'
import { useState } from 'react'
import Script from 'next/script'
import { useCaptchaToken } from './useCaptchaToken'
import { initializeCaptchaHeaders, resolveCaptchaReady } from './captchaHeadersInit'
import { useDarkMode } from '@/hooks/useDarkMode'
import { TURNSTILE_SITE_KEY } from '@safe-global/utils/config/constants'
import CaptchaModal from './CaptchaModal'

// Register the CGW header interceptor once at module load time,
// before any requests can be made.
initializeCaptchaHeaders()

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

export function CaptchaProvider({ children }: { children: ReactNode }) {
  const isDarkMode = useDarkMode()
  const [isScriptReady, setIsScriptReady] = useState(false)

  const captcha = useCaptchaToken({ theme: isDarkMode ? 'dark' : 'light', isScriptReady })

  return (
    <>
      {children}
      {TURNSTILE_SITE_KEY && (
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
      )}
    </>
  )
}
