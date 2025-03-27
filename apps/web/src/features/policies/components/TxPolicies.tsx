import { type ReactElement } from 'react'
import TxCard from '@/components/tx-flow/common/TxCard'
import { Box, SvgIcon, Typography } from '@mui/material'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import useSafeAddress from '@/hooks/useSafeAddress'
import SuccessIcon from '@/public/images/common/success.svg'
import AlertIcon from '@/public/images/common/alert.svg'

import { useCheckTransaction } from '../hooks/useCheckTransaction'

const TxChecks = ({ transaction }: { transaction: SafeTransaction }): ReactElement | null => {
  const safe = useSafeAddress()
  const [ok, error, loading] = useCheckTransaction({
    safe,
    to: transaction.data.to,
    value: BigInt(transaction.data.value),
    data: transaction.data.data,
    operation: transaction.data.operation,
  })

  let status = undefined
  if (loading) {
    status = <>Loading...</>
  } else if (error || !ok) {
    status = (
      <Box display="flex" flexDirection="column" alignItems="center" p={2} gap={2}>
        <Box fontSize="53px">
          <SvgIcon component={AlertIcon} inheritViewBox fontSize="inherit" />
        </Box>
        Transaction violates on-chain policies
      </Box>
    )
  } else if (ok) {
    status = (
      <Box display="flex" flexDirection="column" alignItems="center" p={2} gap={2}>
        <Box fontSize="53px">
          <SvgIcon component={SuccessIcon} inheritViewBox fontSize="inherit" />
        </Box>
        Transaction secure
      </Box>
    )
  }

  return (
    <TxCard>
      <Typography variant="h5">On-Chain Policies</Typography>
      {status}
    </TxCard>
  )
}

export default TxChecks
