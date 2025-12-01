import ImageFallback from '@/components/common/ImageFallback'
import { Avatar } from '@mui/material'

const addressImageStyle = { borderRadius: '50%', paddingTop: 2, width: 16, height: 16 }
const addressImageFallbackSrc = '/images/transactions/custom.svg'

export const AddressImage = ({ logoUrl }: { logoUrl?: string }) => {
  if (!logoUrl) {
    return <Avatar src={addressImageFallbackSrc} style={addressImageStyle} />
  }

  return <ImageFallback fallbackSrc={addressImageFallbackSrc} src={logoUrl} style={addressImageStyle} />
}
