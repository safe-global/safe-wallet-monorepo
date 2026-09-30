import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import dynamic from 'next/dynamic'
import React, { useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
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
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <CheckWallet allowNonOwner allowUndeployedSafe>
          {(isOk) => (
            <Button
              data-testid="activate-account-btn-cf"
              size="default"
              onClick={activateAccount}
              disabled={isProcessing || !isOk}
              className="w-full group-data-[collapsible=icon]:!min-w-9 group-data-[collapsible=icon]:!w-9 group-data-[collapsible=icon]:!px-0"
            >
              {isProcessing ? (
                <>
                  <Typography variant="paragraph-small" className="mr-2 group-data-[collapsible=icon]:hidden">
                    Processing
                  </Typography>
                  <Spinner className="size-4" />
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
      </TooltipTrigger>
      {isProcessing && <TooltipContent>The safe activation is already in process</TooltipContent>}
    </Tooltip>
  )
}

export default ActivateAccountButton
