import type { ReactNode } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'
import Script from 'next/script'
import { useCaptchaToken } from '@/hooks/useCaptchaToken'
import { initializeCaptchaHeaders, resolveCaptchaReady } from '@/hooks/captchaHeadersInit'
import { useDarkMode } from '@/hooks/useDarkMode'
import { TURNSTILE_SITE_KEY } from '@safe-global/utils/config/constants'
import CaptchaModal from './CaptchaModal'

// Register the CGW header interceptor once at module load time,
// before any requests can be made.
initializeCaptchaHeaders()

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

interface CaptchaContextType {
  token: string | null
  isLoading: boolean
  isReady: boolean
  error: Error | null
  refreshToken: () => void
}

const CaptchaContext = createContext<CaptchaContextType | undefined>(undefined)

export function CaptchaProvider({ children }: { children: ReactNode }) {
  const isDarkMode = useDarkMode()
  const [isScriptReady, setIsScriptReady] = useState(false)

  const captcha = useCaptchaToken({ theme: isDarkMode ? 'dark' : 'light', isScriptReady })

  const contextValue = useMemo(
    () => ({
      token: captcha.token,
      isLoading: captcha.isLoading,
      error: captcha.error,
      refreshToken: captcha.refreshToken,
      isReady: !!captcha.token || !TURNSTILE_SITE_KEY,
    }),
    [captcha.token, captcha.isLoading, captcha.error, captcha.refreshToken],
  )

  return (
    <CaptchaContext.Provider value={contextValue}>
      {children}
      {TURNSTILE_SITE_KEY && (
        <Script
          src={TURNSTILE_SCRIPT_URL}
          strategy="afterInteractive"
          onReady={() => setIsScriptReady(true)}
          onError={() => resolveCaptchaReady()}
        />
      )}
      <CaptchaModal open={captcha.isModalOpen} onWidgetContainerReady={captcha.onWidgetContainerReady} />
    </CaptchaContext.Provider>
  )
}

export function useCaptcha() {
  const context = useContext(CaptchaContext)
  if (!context) {
    throw new Error('useCaptcha must be used within a CaptchaProvider')
  }
  return context
}
