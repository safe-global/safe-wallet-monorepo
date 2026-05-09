import type { MutableRefObject, ReactElement } from 'react'
import type { SafeAppDataWithPermissions } from '@/components/safe-apps/types'
import css from './styles.module.css'
import { sanitizeUrl } from '@/utils/url'

type SafeAppIFrameProps = {
  appUrl: string
  allowedFeaturesList: string
  title?: string
  iframeRef?: MutableRefObject<HTMLIFrameElement | null>
  onLoad?: () => void
  safeApp?: SafeAppDataWithPermissions
}

// see sandbox mdn docs for more details https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox
const IFRAME_SANDBOX_ALLOWED_FEATURES =
  'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads allow-orientation-lock'

const SafeAppIframe = ({
  appUrl,
  allowedFeaturesList,
  iframeRef,
  onLoad,
  title,
  safeApp,
}: SafeAppIFrameProps): ReactElement => {
  // Use the original URL with parameters if available, otherwise fallback to the provided URL
  const safeAppUrl = safeApp?.originalUrl || appUrl

  // Ensure the URL is valid and sanitized
  const isValidUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url)
      return ['http:', 'https:'].includes(parsedUrl.protocol)
    } catch {
      return false
    }
  }

  const sanitizedSafeAppUrl = isValidUrl(safeAppUrl) ? sanitizeUrl(safeAppUrl) : ''
  const encodedAppUrl = encodeURIComponent(appUrl)

  return (
    <iframe
      className={css.iframe}
      id={`iframe-${encodedAppUrl}`}
      ref={iframeRef}
      src={sanitizedSafeAppUrl}
      title={title}
      onLoad={onLoad}
      sandbox={IFRAME_SANDBOX_ALLOWED_FEATURES}
      allow={allowedFeaturesList}
    />
  )
}

export default SafeAppIframe
