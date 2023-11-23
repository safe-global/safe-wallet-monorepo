import { Box, Button, Typography } from '@mui/material'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import ReplaceTxIcon from '@/public/images/transactions/replace-tx.svg'
import { TxModalContext } from '../..'
import TxCard from '../../common/TxCard'

export function CancelRecoveryOverview({ onSubmit }: { onSubmit: () => void }): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)

  const onClose = () => {
    setTxFlow(undefined)
  }

  return (
    <TxCard>
      <Box display="flex" flexDirection="column" alignItems="center" p={5}>
        {/* TODO: Replace with correct icon when provided */}
        <ReplaceTxIcon />

        <Typography mb={1} variant="h4" mt={5} fontWeight={700}>
          Do you want to cancel the Account recovery?
        </Typography>

        <Typography variant="body2" mb={3} textAlign="center">
          If it is was an unwanted recovery attempt or you&apos;ve noticed something suspicious, you can cancel it by
          increasing the nonce of the recovery module.
        </Typography>

        <Box display="flex" gap={3}>
          <Button variant="outlined" onClick={onClose}>
            Go back
          </Button>

          <Button variant="contained" onClick={onSubmit}>
            Yes, cancel recovery
          </Button>
        </Box>
      </Box>
    </TxCard>
  )
}
