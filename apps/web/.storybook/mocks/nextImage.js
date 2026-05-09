import * as React from 'react'

/**
 * Mock for next/image that bypasses the image loader stub in Storybook.
 * This resolves the "unsupported file type: undefined" error when building Storybook.
 */
const MockNextImage = ({
  src,
  alt,
  width,
  height,
  fill,
  style,
  className,
  priority: _priority,
  loading: _loading,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  unoptimized: _unoptimized,
  onLoad,
  onError,
  ...rest
}) => {
  // Handle StaticImageData (imported images)
  const imgSrc = typeof src === 'object' ? src.src : src
  const imgWidth = width ?? (typeof src === 'object' ? src.width : undefined)
  const imgHeight = height ?? (typeof src === 'object' ? src.height : undefined)

  const imgStyle = fill
    ? { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', ...style }
    : (style ?? {})

  return React.createElement('img', {
    src: imgSrc,
    alt,
    width: imgWidth,
    height: imgHeight,
    style: imgStyle,
    className,
    onLoad,
    onError,
    ...rest,
  })
}

export default MockNextImage
