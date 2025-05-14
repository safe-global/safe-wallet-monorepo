import ImageFallback from '@/components/common/ImageFallback'

const APP_LOGO_FALLBACK_IMAGE = `/images/apps/app-placeholder.svg`

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
}) => <ImageFallback src={src} alt={alt} width={width} height={height} fallbackSrc={fallback} />

export default SafeAppIconCard
