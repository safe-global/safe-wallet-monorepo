import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import dynamic from 'next/dynamic'
import React, { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { selectUndeployedSafe } from '../../store/undeployedSafesSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import CheckWallet from '@/components/common/CheckWallet'
import { PendingSafeStatus } from '@safe-global/utils/features/counterfactual/store/types'
import { ActivateAccountButtonView } from '@views/features/counterfactual/components/ActivateAccountButton/ActivateAccountButtonView'

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
    <ActivateAccountButtonView
      isProcessing={isProcessing}
      onActivate={activateAccount}
      checkWallet={(render) => (
        <CheckWallet allowNonOwner allowUndeployedSafe>
          {render}
        </CheckWallet>
      )}
    />
  )
}

export default ActivateAccountButton
