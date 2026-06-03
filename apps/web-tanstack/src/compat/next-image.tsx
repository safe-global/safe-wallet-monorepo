/**
 * Compatibility shim for `next/image`: a plain <img> with the same
 * src/width/height/alt surface, since apps/web sets `images.unoptimized: true`.
 */
import type { ImgHTMLAttributes } from 'react'

// next/image re-exports this for callers that type their own image props.
export type StaticImageData = {
  src: string
  height: number
  width: number
  blurDataURL?: string
}

export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'placeholder' | 'src' | 'width' | 'height'> & {
  src: string | { src: string; width?: number; height?: number }
  width?: number | string
  height?: number | string
  alt: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  fill?: boolean
  loader?: unknown
  quality?: number
  unoptimized?: boolean
}

export default function Image({
  src,
  width,
  height,
  alt,
  priority: _priority,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  fill,
  loader: _loader,
  quality: _quality,
  unoptimized: _unoptimized,
  style,
  ...rest
}: ImageProps) {
  const resolvedSrc = typeof src === 'string' ? src : src.src
  const fillStyle = fill ? { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', ...style } : style
  return <img {...rest} src={resolvedSrc} width={width} height={height} alt={alt} style={fillStyle} />
}
