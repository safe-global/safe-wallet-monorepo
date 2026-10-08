import { AppRoutes } from '@/config/routes'
import { useIsRecoverySupported, useRecovery } from '@/features/recovery'
import dynamic from 'next/dynamic'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { useRouter } from 'next/router'
import { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { AddOwnerFlow, TokenTransferFlow, UpsertRecoveryFlow } from '@/components/tx-flow/flows'
const ActivateAccountFlow = dynamic(() => import('../ActivateAccountFlow'))
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { useIsSwapFeatureEnabled } from '@/features/swap'
import { FirstTxFlowView } from '@views/features/counterfactual/components/FirstTxFlow/FirstTxFlowView'

const FirstTxFlow = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const txBuilder = useTxBuilderApp()
  const router = useRouter()
  const { setTxFlow } = useContext(TxModalContext)
  const supportsRecovery = useIsRecoverySupported()
  const [recovery] = useRecovery()
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()

  const handleClick = (onClick: () => void) => {
    onClose()
    onClick()
  }

  const onSendToken = () => {
    trackEvent({ ...OVERVIEW_EVENTS.CHOOSE_TRANSACTION_TYPE, label: 'send_token' })
    setTxFlow(<TokenTransferFlow />)
  }

  const onActivateSafe = () => {
    trackEvent({ ...OVERVIEW_EVENTS.CHOOSE_TRANSACTION_TYPE, label: 'activate_safe' })
    setTxFlow(<ActivateAccountFlow />)
  }

  const onAddSigner = () => {
    trackEvent({ ...OVERVIEW_EVENTS.CHOOSE_TRANSACTION_TYPE, label: 'add_signer' })
    setTxFlow(<AddOwnerFlow />)
  }

  const onRecovery = () => {
    trackEvent({ ...OVERVIEW_EVENTS.CHOOSE_TRANSACTION_TYPE, label: 'setup_recovery' })
    setTxFlow(<UpsertRecoveryFlow />)
  }

  const onSwap = () => {
    trackEvent({ ...OVERVIEW_EVENTS.CHOOSE_TRANSACTION_TYPE, label: 'swap' })
    router.push(
      isSwapFeatureEnabled
        ? { pathname: AppRoutes.swap, query: router.query }
        : { pathname: AppRoutes.apps.index, query: { ...router.query, categories: 'Aggregator' } },
    )
  }

  const onCustomTransaction = () => {
    if (!txBuilder) return

    trackEvent({ ...OVERVIEW_EVENTS.CHOOSE_TRANSACTION_TYPE, label: 'tx_builder' })
    router.push(txBuilder.link)
  }

  const showRecoveryOption = supportsRecovery && !recovery

  return (
    <FirstTxFlowView
      open={open}
      onClose={onClose}
      showRecoveryOption={showRecoveryOption}
      showCustomTransaction={!!txBuilder}
      onActivateSafe={() => handleClick(onActivateSafe)}
      onAddSigner={() => handleClick(onAddSigner)}
      onRecovery={() => handleClick(onRecovery)}
      onSwap={() => handleClick(onSwap)}
      onCustomTransaction={() => handleClick(onCustomTransaction)}
      onSendToken={() => handleClick(onSendToken)}
    />
  )
}

export default FirstTxFlow
