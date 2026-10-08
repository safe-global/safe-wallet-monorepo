import type { ReactElement } from 'react'
import Disclaimer from '@/components/common/Disclaimer'

export type BlockedAddressViewProps = {
  displayAddress: string
  featureTitle: string
  onAccept: () => void
}

export const BlockedAddressView = ({
  displayAddress,
  featureTitle,
  onAccept,
}: BlockedAddressViewProps): ReactElement => (
  <Disclaimer
    title="Blocked address"
    subtitle={displayAddress}
    content={`The above address is part of the OFAC SDN list and the ${featureTitle} is unavailable for sanctioned addresses.`}
    onAccept={onAccept}
  />
)
