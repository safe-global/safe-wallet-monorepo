/**
 * Shim for `next/image` — renders a plain `<img>` element.
 *
 * The Next.js config already uses `unoptimized: true`, so this is a
 * straightforward replacement. Handles both string `src` and the
 * `StaticImageData` object form (Vite asset imports produce `{ src }` or
 * a plain string depending on plugin config).
 */
import { forwardRef, type ImgHTMLAttributes, type CSSProperties } from 'react'

// Re-export so `import type { StaticImageData } from 'next/image'` works.
export interface StaticImageData {
  src: string
  height?: number
  width?: number
  blurDataURL?: string
}

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | StaticImageData
  alt?: string
  width?: number | string
  height?: number | string
  fill?: boolean
  priority?: boolean
  quality?: number
  placeholder?: string
  blurDataURL?: string
  unoptimized?: boolean
  loader?: (p: { src: string; width: number; quality?: number }) => string
  style?: CSSProperties
}

const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  {
    src,
    fill,
    // Next.js-specific props — accepted but ignored in the SPA shim
    priority,
    quality,
    placeholder,
    blurDataURL,
    unoptimized,
    loader,
    style,
    ...rest
  },
  ref,
) {
  // Suppress unused warnings — these props are part of the next/image API
  ;(void priority, void quality, void placeholder, void blurDataURL, void unoptimized, void loader)

  const resolvedSrc = typeof src === 'string' ? src : src.src

  const fillStyle: CSSProperties | undefined = fill
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        ...style,
      }
    : style

  return <img ref={ref} src={resolvedSrc} alt="" style={fillStyle} {...rest} />
})

export default Image
