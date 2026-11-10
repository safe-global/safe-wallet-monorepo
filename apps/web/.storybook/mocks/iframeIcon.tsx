import { useState, type ReactElement } from 'react'

// Stands in for IframeIcon: the same image without the sandboxed iframe, whose late painting left icons
// missing in sweep screenshots. Storybook only loads local mock-assets, so it needs no isolation.
// The image is the outer element so app CSS that targets the icon (`.info img`, `.shadcn-scope img`) still applies.
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
  // Follows src like the iframe does: callers render a placeholder first and the logo once it is known
  const [failedSrc, setFailedSrc] = useState<string>()
  const current = failedSrc === src && fallbackSrc ? fallbackSrc : src
  // Inside the iframe the image fills the box height and is centred: cropped when wider, padded when narrower
  const [fit, setFit] = useState<'contain' | 'cover'>('contain')

  return (
    <img
      src={current}
      alt="Safe App logo"
      title={alt}
      width={width}
      height={height}
      // The app's base styles (img { max-width: 100%; height: auto }) never reach inside the iframe
      style={{
        width,
        height,
        maxWidth: 'none',
        objectFit: fit,
        borderRadius,
        pointerEvents: 'none',
        border: 0,
        display: 'block',
      }}
      onLoad={(event) => {
        const { naturalWidth, naturalHeight } = event.currentTarget
        setFit(naturalWidth / naturalHeight > width / height ? 'cover' : 'contain')
      }}
      onError={() => {
        if (current === src) setFailedSrc(src)
      }}
    />
  )
}

export default IframeIcon
