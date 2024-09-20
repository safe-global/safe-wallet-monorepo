import ImageFallback from '@/components/common/ImageFallback'
import { type ReactElement, memo } from 'react'

const APP_LOGO_FALLBACK_IMAGE = `/images/apps/app-placeholder.svg`

const getIframeContent = (url: string, width: number, height: number, fallback: string): string => {
  return `
     <body style="margin: 0; overflow: hidden; display: flex;">
       <img src="${encodeURI(url)}" alt="Safe App logo" width="${width}" height="${height}" />
       <script>
          document.querySelector('img').onerror = (e) => {
           e.target.onerror = null
           e.target.src = "${fallback}"
         }
       </script>
     </body>
  `
}

export const _isSafeSrc = (src: string) => {
  const allowedHosts = ['.safe.global', '.5afe.dev']
  const isRelative = src.startsWith('/')

  let hostname = ''
  if (!isRelative) {
    try {
      hostname = new URL(src).hostname
    } catch (e) {
      return false
    }
  }

  return isRelative || allowedHosts.some((host) => hostname.endsWith(host))
}

const SafeAppIconCard = ({
  src,
  alt,
  width = 48,
  height = 48,
  fallback = APP_LOGO_FALLBACK_IMAGE,
}: {
  src: string
  alt: string
  width?: number
  height?: number
  fallback?: string
}): ReactElement => {
  if (_isSafeSrc(src)) {
    return <ImageFallback src={src} alt={alt} width={width} height={height} fallbackSrc={fallback} />
  }

  return (
    <iframe
      title={alt}
      srcDoc={getIframeContent(src, width, height, fallback)}
      sandbox="allow-scripts"
      referrerPolicy="strict-origin"
      width={width}
      height={height}
      style={{ pointerEvents: 'none', border: 0, borderRadius: '100%' }}
      tabIndex={-1}
      loading="lazy"
    />
  )
}

export default memo(SafeAppIconCard)
