import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { Typography } from '@/components/ui/typography'
import type { ReactNode, ReactElement } from 'react'
import CopyButton from '../CopyButton'
import EthHashInfo from '../EthHashInfo'

const CopyAddressButton = ({
  prefix,
  address,
  copyPrefix,
  children,
  trusted = true,
}: {
  prefix?: string
  address: string
  copyPrefix?: boolean
  children?: ReactNode
  trusted?: boolean
}): ReactElement => {
  const addressText = copyPrefix && prefix ? `${prefix}:${address}` : address

  const checksummedAddress = checksumAddress(address)

  const dialogContent = trusted ? undefined : (
    <div className="flex flex-col gap-4">
      <EthHashInfo
        address={checksummedAddress}
        shortAddress={false}
        copyAddress={false}
        showCopyButton={false}
        hasExplorer
      />
      <Typography>
        The copied address is linked to a transaction with an untrusted token. Make sure you are interacting with the
        right address.
      </Typography>
    </div>
  )

  return (
    <CopyButton text={addressText} dialogContent={dialogContent}>
      {children}
    </CopyButton>
  )
}

export default CopyAddressButton
