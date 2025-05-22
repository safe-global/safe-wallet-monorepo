import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import dynamic from 'next/dynamic'
import React, { useContext } from 'react'
import { Button, CircularProgress, Tooltip, Typography } from '@mui/material'
import { TxModalContext } from '@/components/tx-flow'
import { selectUndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import CheckWallet from '@/components/common/CheckWallet'
import { PendingSafeStatus } from '@safe-global/utils/features/counterfactual/store/types'

const ActivateAccountFlow = dynamic(() => import('./ActivateAccountFlow'))

const ActivateAccountButton = () => {
  const { safe, safeAddress } = useSafeInfo()
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, safe.chainId, safeAddress))
  const { setTxFlow } = useContext(TxModalContext)

  const isProcessing = undeployedSafe?.status.status !== PendingSafeStatus.AWAITING_EXECUTION

  const activateAccount = () => {
    trackEvent({ ...OVERVIEW_EVENTS.CHOOSE_TRANSACTION_TYPE, label: 'activate_now' })
    setTxFlow(<ActivateAccountFlow />)
  }

  return (
    <Tooltip title={isProcessing ? 'The safe activation is already in process' : undefined}>
      <span>
        <CheckWallet allowNonOwner allowUndeployedSafe>
          {(isOk) => (
            <Button
              data-testid="activate-account-btn-cf"
              variant="contained"
              size="small"
              fullWidth
              onClick={activateAccount}
              disabled={isProcessing || !isOk}
              sx={{ minHeight: '40px' }}
            >
              {isProcessing ? (
                <>
                  <Typography variant="body2" component="span" mr={1}>
                    Processing
                  </Typography>
                  <CircularProgress size={16} />
                </>
              ) : (
                'Activate now'
              )}
            </Button>
          )}
        </CheckWallet>
      </span>
    </Tooltip>
  )
}

export default ActivateAccountButton
