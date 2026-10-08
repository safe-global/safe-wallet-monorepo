import type { ReactElement } from 'react'
import { useIsBelowSm } from '@/hooks/useMediaQuery'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { BlockedAddressView } from '@views/components/common/BlockedAddress/BlockedAddressView'

const BlockedAddress = ({
  address,
  featureTitle,
  onClose,
}: {
  address: string
  featureTitle: string
  onClose?: () => void
}): ReactElement => {
  const isMobile = useIsBelowSm()
  const displayAddress = address && isMobile ? shortenAddress(address) : address
  const router = useRouter()

  const handleAccept = () => {
    router.push({ pathname: AppRoutes.home, query: router.query })
  }

  return (
    <BlockedAddressView
      displayAddress={displayAddress}
      featureTitle={featureTitle}
      onAccept={onClose ?? handleAccept}
    />
  )
}

export default BlockedAddress
