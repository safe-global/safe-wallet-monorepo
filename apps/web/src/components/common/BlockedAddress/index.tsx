import type { ReactElement } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useRouter } from 'next/router'
import Disclaimer from '@/components/common/Disclaimer'
import { AppRoutes } from '@/config/routes'

const BlockedAddress = ({
  address,
  featureTitle,
  onClose,
}: {
  address: string
  featureTitle: string
  onClose?: () => void
}): ReactElement => {
  const isMobile = useIsMobile()
  const displayAddress = address && isMobile ? shortenAddress(address) : address
  const router = useRouter()

  const handleAccept = () => {
    router.push({ pathname: AppRoutes.home, query: router.query })
  }

  return (
    <Disclaimer
      title="Blocked address"
      subtitle={displayAddress}
      content={`The above address is part of the OFAC SDN list and the ${featureTitle} is unavailable for sanctioned addresses.`}
      onAccept={onClose ?? handleAccept}
    />
  )
}

export default BlockedAddress
