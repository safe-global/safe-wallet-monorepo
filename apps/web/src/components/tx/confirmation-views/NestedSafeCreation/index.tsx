import { Box, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import type { TransactionData } from '@safe-global/safe-gateway-typescript-sdk'

import useAsync from '@safe-global/utils/hooks/useAsync'
import { predictSafeAddress } from '@/features/multichain/utils/utils'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import EthHashInfo from '@/components/common/EthHashInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { _getFactoryAddressAndSetupData } from '@/utils/nested-safes'

export function NestedSafeCreation({ txData }: { txData: TransactionData }): ReactElement | null {
  const addressBook = useAddressBook()
  const provider = useWeb3ReadOnly()

  const [predictedSafeAddress] = useAsync(async () => {
    if (provider) {
      const { factoryAddress, ...setupData } = _getFactoryAddressAndSetupData(txData)
      return predictSafeAddress(setupData, factoryAddress, provider)
    }
  }, [provider, txData])

  if (!predictedSafeAddress) {
    return null
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary" whiteSpace="nowrap">
        Nested Safe
      </Typography>

      <div>
        <EthHashInfo
          name={addressBook[predictedSafeAddress]}
          address={predictedSafeAddress}
          shortAddress={false}
          hasExplorer
          showCopyButton
          showAvatar
        />
      </div>
    </Box>
  )
}
