import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Box, Button, Typography } from '@mui/material'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import css from './styles.module.css'

import ReplaceTxIcon from '@/public/images/transactions/replace-tx.svg'
import { TxModalContext } from '../..'
import TxCard from '../../common/TxCard'
import { TxFlowContext } from '../../TxFlowProvider'

export function CancelRecoveryOverview(): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  const { onNext } = useContext(TxFlowContext)

  const onClose = () => {
    setTxFlow(undefined)
    trackEvent(RECOVERY_EVENTS.GO_BACK)
  }

  return (
    <TxCard>
      <Box display="flex" flexDirection="column" alignItems="center" p={{ md: 5 }}>
        {/* TODO: Replace with correct icon when provided */}
        <ReplaceTxIcon />

        <Typography mb={1} variant="h4" mt={5} fontWeight={700} textAlign="center">
          Do you want to cancel the Account recovery?
        </Typography>

        <Typography variant="body2" mb={3} textAlign="center">
          If it is an unwanted recovery proposal or you&apos;ve noticed something suspicious, you can cancel it at any
          time.
        </Typography>

        <Box display="flex" columnGap={3} rowGap={1} flexWrap="wrap">
          <Button variant="outlined" onClick={onClose} className={css.button} size="small">
            Go back
          </Button>

          <Button data-testid="cancel-proposal-btn" variant="contained" onClick={onNext} className={css.button}>
            Yes, cancel proposal
          </Button>
        </Box>
      </Box>
    </TxCard>
  )
}
