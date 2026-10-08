import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { ReactNode, ReactElement } from 'react'
import CopyButton from '../CopyButton'
import EthHashInfo from '../EthHashInfo'
import { CopyAddressButtonView } from '@views/components/common/CopyAddressButton/CopyAddressButtonView'

const CopyAddressButton = ({
  address,
  children,
  trusted = true,
  initialToolTipText,
}: {
  address: string
  children?: ReactNode
  trusted?: boolean
  initialToolTipText?: string
}): ReactElement => {
  const checksummedAddress = checksumAddress(address)

  const dialogContent = trusted ? undefined : (
    <CopyAddressButtonView
      hashInfo={
        <EthHashInfo
          address={checksummedAddress}
          shortAddress={false}
          copyAddress={false}
          showCopyButton={false}
          hasExplorer
        />
      }
    />
  )

  return (
    <CopyButton text={address} dialogContent={dialogContent} initialToolTipText={initialToolTipText}>
      {children}
    </CopyButton>
  )
}

export default CopyAddressButton
