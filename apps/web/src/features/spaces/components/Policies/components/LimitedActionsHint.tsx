import { Info } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'

const LimitedActionsHint = () => (
  <Tooltip>
    <TooltipTrigger
      render={<span />}
      className="flex items-center gap-1.5 text-warning-strong"
      data-testid="policies-limited-actions-hint"
    >
      <Typography variant="paragraph-small-medium" color="warning">
        Some actions limited
      </Typography>
      <Info className="size-4" aria-hidden />
    </TooltipTrigger>
    <TooltipContent className="flex max-w-none flex-col gap-1">
      <Typography variant="paragraph-mini-bold" as="h4" className="whitespace-nowrap">
        {'Nested Safe proposals must be created in Safe{Wallet}.'}
      </Typography>
      <p>Spending limits covered on 10 networks today</p>
      <ExternalLink
        noIcon
        href={HelpCenterArticle.POLICIES}
        className="inline-block self-start text-green-500! dark:text-background!"
      >
        Learn more
      </ExternalLink>
    </TooltipContent>
  </Tooltip>
)

export default LimitedActionsHint
