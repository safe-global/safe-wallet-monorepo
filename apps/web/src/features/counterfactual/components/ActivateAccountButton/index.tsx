import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import dynamic from 'next/dynamic'
import React, { useContext } from 'react'
import { Button, CircularProgress, Tooltip, Typography } from '@mui/material'
import { Rocket } from 'lucide-react'
import { TxModalContext } from '@/components/tx-flow'
import { selectUndeployedSafe } from '../../store/undeployedSafesSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import CheckWallet from '@/components/common/CheckWallet'
import { PendingSafeStatus } from '@safe-global/utils/features/counterfactual/store/types'

const ActivateAccountFlow = dynamic(() => import('../ActivateAccountFlow'))

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
    <Tooltip title={isProcessing ? 'The safe activation is already in process' : 'Activate now'}>
      <span>
        <CheckWallet allowNonOwner allowUndeployedSafe>
          {(isOk) => (
            <Button
              data-testid="activate-account-btn-cf"
              variant="contained"
              size="medium"
              fullWidth
              onClick={activateAccount}
              disabled={isProcessing || !isOk}
              className="group-data-[collapsible=icon]:!min-w-9 group-data-[collapsible=icon]:!w-9 group-data-[collapsible=icon]:!px-0"
            >
              {isProcessing ? (
                <>
                  <Typography variant="body2" component="span" mr={1} className="group-data-[collapsible=icon]:hidden">
                    Processing
                  </Typography>
                  <CircularProgress size={16} />
                </>
              ) : (
                <>
                  <Rocket className="hidden size-4 shrink-0 group-data-[collapsible=icon]:block" />
                  <span className="group-data-[collapsible=icon]:hidden">Activate now</span>
                </>
              )}
            </Button>
          )}
        </CheckWallet>
      </span>
    </Tooltip>
  )
}

export default ActivateAccountButton
