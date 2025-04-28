import type { MutableRefObject, ReactElement } from 'react'
import type { SafeAppDataWithPermissions } from '@/components/safe-apps/types'
import css from './styles.module.css'

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

  return (
    <iframe
      className={css.iframe}
      id={`iframe-${appUrl}`}
      ref={iframeRef}
      src={safeAppUrl}
      title={title}
      onLoad={onLoad}
      sandbox={IFRAME_SANDBOX_ALLOWED_FEATURES}
      allow={allowedFeaturesList}
    />
  )
}

export default SafeAppIframe
