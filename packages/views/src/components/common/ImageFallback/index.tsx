import type { ReactElement } from 'react'
import { useState } from 'react'

type ImageAttributes = React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>

type ImageFallbackProps = ImageAttributes &
  (
    | {
        fallbackSrc: string
        fallbackComponent?: ReactElement
      }
    | {
        fallbackSrc?: string
        fallbackComponent: ReactElement
      }
  )

const ImageFallback = ({ src, fallbackSrc, fallbackComponent, ...props }: ImageFallbackProps): React.ReactElement => {
  const [isError, setIsError] = useState<boolean>(false)

  if (isError && fallbackComponent) return fallbackComponent

  return (
    <img
      {...props}
      alt={props.alt || ''}
      src={isError || src === undefined ? fallbackSrc : src}
      onError={() => setIsError(true)}
    />
  )
}

export default ImageFallback
