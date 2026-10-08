import { useContext, type ReactElement } from 'react'
import { useIsCounterfactualSafe, CounterfactualFeature } from '@/features/counterfactual'
import { useLoadFeature } from '@/features/__core__'
import { OVERVIEW_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'
import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'
import { SidebarActionButtonView } from '@views/features/spaces/components/Sidebar/NewTransactionButton/SidebarActionButtonView'

export const SidebarActionButton = (): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { ActivateAccountButton } = useLoadFeature(CounterfactualFeature)

  const onClick = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
    trackEvent(
      { ...OVERVIEW_EVENTS.NEW_TRANSACTION, label: 'sidebar' },
      { [MixpanelEventParams.SIDEBAR_ELEMENT]: 'New Transaction' },
    )
  }

  if (isCounterfactualSafe) {
    return <ActivateAccountButton />
  }

  return (
    <CheckWallet allowSpendingLimit>
      {(isOk) => <SidebarActionButtonView disabled={!isOk} onClick={onClick} />}
    </CheckWallet>
  )
}
