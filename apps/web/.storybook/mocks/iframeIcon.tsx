import { useState, type ReactElement } from 'react'

// Stands in for IframeIcon: the same image without the sandboxed iframe, whose late painting left icons
// missing in sweep screenshots. Storybook only loads local mock-assets, so it needs no isolation.
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
  const [current, setCurrent] = useState(src)

  return (
    <div
      title={alt}
      style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
    >
      <img
        src={current}
        alt="Safe App logo"
        height={height}
        style={{ width: 'auto', borderRadius }}
        onError={() => {
          if (fallbackSrc && current !== fallbackSrc) setCurrent(fallbackSrc)
        }}
      />
    </div>
  )
}

export default IframeIcon
