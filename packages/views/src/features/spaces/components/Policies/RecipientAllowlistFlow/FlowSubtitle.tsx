import type { ReactElement } from 'react'
import { Info } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import {
  FLOW_HELP_LABEL,
  FLOW_SUBTITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'

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

export default FlowSubtitle
