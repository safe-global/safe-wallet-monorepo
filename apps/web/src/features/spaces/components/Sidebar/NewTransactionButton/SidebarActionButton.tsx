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
          // Collapsed: `size-8!` (32px square), matching the workspace switcher and the
          // back-to-workspace button it stacks with in the icon rail. A `w-9` alone left the size's
          // `h-10` in place, so it sat 36x40 — wider and taller than everything around it. The `!` is
          // what beats `h-10`, the same way SidebarMenuButton's own icon-mode sizing does.
          // eslint-disable-next-line no-restricted-syntax -- sidebar action button: sidebar-accent hover + dark border + collapsible icon-mode sizing
          className="w-full font-semibold py-0 hover:bg-sidebar-accent dark:border-border dark:hover:bg-sidebar-accent group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:px-0"
        >
          <Plus className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">New transaction</span>
        </Button>
      )}
    </CheckWallet>
  )
}
