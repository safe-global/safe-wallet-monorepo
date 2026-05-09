import type { ReactElement } from 'react'
import { safeEncodeURI } from '@/utils/url'

const getIframeContent = (url: string, height: number, borderRadius?: string, fallbackSrc?: string): string => {
  const style = borderRadius ? `border-radius: ${borderRadius};` : ''
  const fallback = fallbackSrc ? safeEncodeURI(fallbackSrc) : ''
  return `
    <body style="margin: 0; overflow: hidden; display: flex; align-items: center; justify-content: center;">
      <img src="${safeEncodeURI(url)}" alt="Safe App logo" height="${height}" width="auto" style="${style}" />
      <script>
        document.querySelector('img').onerror = (e) => {
          e.target.onerror = null
          e.target.src = "${fallback}"
        }
      </script>
    </body>
  `
}

const IframeIcon = ({
  src,
  alt,
  width = 48,
  height = 48,
  borderRadius,
  fallbackSrc,
}: {
  src: string
  alt: string
  width?: number
  height?: number
  borderRadius?: string
  fallbackSrc?: string
}): ReactElement => {
  return (
    <iframe
      title={alt}
      srcDoc={getIframeContent(src, height, borderRadius, fallbackSrc)}
      sandbox="allow-scripts"
      referrerPolicy="strict-origin"
      width={width}
      height={height}
      style={{ pointerEvents: 'none', border: 0, display: 'block' }}
      tabIndex={-1}
      loading="lazy"
    />
  )
}

export default IframeIcon
