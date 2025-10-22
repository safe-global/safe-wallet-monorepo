import type { ReactElement } from 'react'

const FALLBACK_ICON = '/images/common/token-placeholder.svg'

const getIframeContent = (url: string, width: number, height: number): string => {
  const imageUrl = url || FALLBACK_ICON
  return `
     <body style="margin: 0; overflow: hidden; display: flex;">
       <img src="${encodeURI(imageUrl)}" alt="Safe App logo" width="${width}" height="${height}" />
       <script>
          document.querySelector('img').onerror = (e) => {
           e.target.onerror = null
           e.target.src = "${FALLBACK_ICON}"
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
}: {
  src: string
  alt: string
  width?: number
  height?: number
}): ReactElement => {
  return (
    <iframe
      title={alt}
      srcDoc={getIframeContent(src, width, height)}
      sandbox="allow-scripts"
      referrerPolicy="strict-origin"
      width={width}
      height={height}
      style={{ pointerEvents: 'none', border: 0 }}
      tabIndex={-1}
      loading="lazy"
    />
  )
}

export default IframeIcon
