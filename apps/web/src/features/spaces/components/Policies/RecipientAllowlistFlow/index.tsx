import type { ReactElement } from 'react'
import { Info, ShieldCheck } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { TxFlowType } from '@/services/analytics'
import CreateRecipientAllowlistPolicy from './CreateStep'
import { CREATE_STEP_TITLE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import {
  FLOW_HELP_LABEL,
  FLOW_SUBTITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'

const RecipientAllowlistIcon = (): ReactElement => <ShieldCheck aria-hidden />

const FlowSubtitle = (): ReactElement => (
  <span className="flex items-center gap-2.5">
    {FLOW_SUBTITLE}
    <ExternalLink
      href={HelpCenterArticle.POLICIES}
      noIcon
      aria-label={FLOW_HELP_LABEL}
      className="text-muted-foreground no-underline hover:text-foreground"
    >
      <Info className="size-4" aria-hidden />
    </ExternalLink>
  </span>
)

/** The SafeScopeProvider sits above TxFlow so every tx-flow provider and hook resolves the Safe picked in step 1. */
const RecipientAllowlistFlow = (): ReactElement => (
  <SafeScopeProvider>
    <TxFlow
      icon={RecipientAllowlistIcon}
      subtitle={<FlowSubtitle />}
      eventCategory={TxFlowType.SETUP_SPACE_RECIPIENT_ALLOWLIST}
    >
      <TxFlowStep title={CREATE_STEP_TITLE} hideNonce>
        <CreateRecipientAllowlistPolicy />
      </TxFlowStep>
    </TxFlow>
  </SafeScopeProvider>
)

export default RecipientAllowlistFlow
