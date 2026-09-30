import { useCallback, useState, type ReactElement } from 'react'
import { Info, WalletCards } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { TxFlowType } from '@/services/analytics'
import { ExistingSpendingLimitsProvider } from './ExistingSpendingLimitsProvider'
import CreateSpendingLimitPolicy from './CreateStep'
import ReviewSpendingLimitPolicy from './ReviewStep'
import { createDefaultFormValues } from './types'
import { CREATE_STEP_TITLE, FLOW_HELP_LABEL, FLOW_SUBTITLE } from './constants'

const SpendingLimitIcon = (): ReactElement => <WalletCards aria-hidden />

const FlowSubtitle = (): ReactElement => (
  <span className="flex items-center gap-2.5">
    {FLOW_SUBTITLE}
    <ExternalLink
      href={HelpCenterArticle.SPENDING_LIMITS}
      noIcon
      aria-label={FLOW_HELP_LABEL}
      className="text-muted-foreground no-underline hover:text-foreground"
    >
      <Info className="size-4" aria-hidden />
    </ExternalLink>
  </span>
)

/**
 * The SafeScopeProvider sits above TxFlow so every tx-flow provider and hook resolves the Safe picked
 * in step 1. It starts empty because step 1 is where that Safe is chosen.
 */
const SpendingLimitFlow = (): ReactElement => {
  // `TxFlow` renders one step at a time, so anything the Create step should still know after a trip to
  // Review and back has to be held here instead.
  const [isCalloutDismissed, setIsCalloutDismissed] = useState(false)
  const dismissCallout = useCallback(() => setIsCalloutDismissed(true), [])

  return (
    <SafeScopeProvider>
      <ExistingSpendingLimitsProvider>
        <TxFlow
          icon={SpendingLimitIcon}
          subtitle={<FlowSubtitle />}
          ReviewTransactionComponent={ReviewSpendingLimitPolicy}
          eventCategory={TxFlowType.SETUP_SPACE_SPENDING_LIMIT}
          initialData={createDefaultFormValues()}
        >
          <TxFlowStep title={CREATE_STEP_TITLE} hideNonce>
            <CreateSpendingLimitPolicy isCalloutDismissed={isCalloutDismissed} onDismissCallout={dismissCallout} />
          </TxFlowStep>
        </TxFlow>
      </ExistingSpendingLimitsProvider>
    </SafeScopeProvider>
  )
}

export default SpendingLimitFlow
