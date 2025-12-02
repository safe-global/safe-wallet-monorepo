import type { ReactElement } from 'react'

const getIframeContent = (
  url: string,
  width: number,
  height: number,
  borderRadius?: string,
  fallbackSrc?: string,
): string => {
  const style = borderRadius ? `border-radius: ${borderRadius};` : ''
  const fallback = fallbackSrc ? encodeURI(fallbackSrc) : ''
  return `
     <body style="margin: 0; overflow: hidden; display: flex;">
       <img src="${encodeURI(url)}" alt="Safe App logo" width="${width}" height="${height}" style="${style}" />
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
      srcDoc={getIframeContent(src, width, height, borderRadius, fallbackSrc)}
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
