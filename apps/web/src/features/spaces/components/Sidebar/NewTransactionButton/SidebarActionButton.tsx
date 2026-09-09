import { useContext, type ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { useIsCounterfactualSafe, CounterfactualFeature } from '@/features/counterfactual'
import { useLoadFeature } from '@/features/__core__'
import { OVERVIEW_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'
import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'
import { Button } from '@/components/ui/button'

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
      {(isOk) => (
        <Button
          data-testid="new-tx-btn"
          onClick={onClick}
          variant="outline"
          size="lg"
          disabled={!isOk}
          // Collapsed: 36px square for the icon rail. `size-9!` sets both axes; `w-9` alone left the size's
          // `h-10` (36x40), and only the `!` beats that height. Dev's muted-fill/no-border skin is kept as-is.
          // eslint-disable-next-line no-restricted-syntax -- sidebar action button: sidebar-accent hover + dark border + collapsible icon-mode sizing
          className="w-full font-semibold py-0 hover:bg-sidebar-accent dark:border-border dark:hover:bg-sidebar-accent group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:bg-muted group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:shadow-none"
        >
          <Plus className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">New transaction</span>
        </Button>
      )}
    </CheckWallet>
  )
}
