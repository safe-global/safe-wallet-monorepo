import type { ReactElement } from 'react'
import { Info, WalletCards } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import CreateSpendingLimitPolicy from './CreateStep'
import ReviewSpendingLimitPolicy from './ReviewStep'
import { createDefaultFormValues } from './types'
import { CREATE_STEP_TITLE, FLOW_HELP_LABEL, FLOW_SUBTITLE } from './constants'

/** Same glyph as the Policies catalogue tile. */
const SpendingLimitIcon = (): ReactElement => <WalletCards aria-hidden />

/** Mirrors the WA-3148 intro dialog's title: the flow subtitle plus a link to the help article. */
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
 * Space-level spending limit policy flow (WA-3150). The SafeScopeProvider sits above TxFlow so every
 * tx-flow provider and hook resolves the Safe picked in step 1 (WA-3146); it starts empty because the
 * first step is where the Safe is chosen. No `eventCategory` until the flow can complete (WA-3152).
 */
const SpendingLimitFlow = (): ReactElement => (
  <SafeScopeProvider>
    <TxFlow
      icon={SpendingLimitIcon}
      subtitle={<FlowSubtitle />}
      ReviewTransactionComponent={ReviewSpendingLimitPolicy}
      initialData={createDefaultFormValues()}
    >
      <TxFlowStep title={CREATE_STEP_TITLE} hideNonce>
        <CreateSpendingLimitPolicy />
      </TxFlowStep>
    </TxFlow>
  </SafeScopeProvider>
)

export default SpendingLimitFlow
