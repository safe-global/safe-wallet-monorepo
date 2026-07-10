import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { Box, Typography } from '@mui/material'
import type { ReactNode, ReactElement } from 'react'
import CopyButton from '../CopyButton'
import EthHashInfo from '../EthHashInfo'

const CopyAddressButton = ({
  address,
  children,
  trusted = true,
}: {
  address: string
  children?: ReactNode
  trusted?: boolean
}): ReactElement => {
  const checksummedAddress = checksumAddress(address)

  const dialogContent = trusted ? undefined : (
    <Box display="flex" flexDirection="column" gap={2}>
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
    </Box>
  )

  return (
    <CopyButton text={address} dialogContent={dialogContent}>
      {children}
    </CopyButton>
  )
}

export default CopyAddressButton
