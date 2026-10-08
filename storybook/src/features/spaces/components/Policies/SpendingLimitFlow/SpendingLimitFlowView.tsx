import type { ReactElement } from 'react'
import { Info } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { FLOW_HELP_LABEL, FLOW_SUBTITLE } from './constants'

/** The flow's subtitle; the flow itself is the `TxFlow` its container renders. */
export const SpendingLimitFlowView = (): ReactElement => (
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

export type SpendingLimitFlowViewProps = Record<string, never>
