import ImageFallback from '@/components/common/ImageFallback'

const addressImageStyle = { borderRadius: '50%', paddingTop: 2, width: 16, height: 16 }
const addressImageFallbackSrc = '/images/transactions/custom.svg'

export const AddressImage = ({ logoUrl }: { logoUrl?: string }) => {
  return <ImageFallback fallbackSrc={addressImageFallbackSrc} src={logoUrl} style={addressImageStyle} />
}
