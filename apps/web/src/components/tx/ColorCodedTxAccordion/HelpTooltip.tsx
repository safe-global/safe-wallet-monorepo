import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import InfoIcon from '@safe-global/views/assets/images/notifications/info.svg'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'

import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const HelpTooltip = () => (
  <Tooltip>
    <TooltipTrigger
      render={
        <span>
          <InfoIcon className="ml-1 inline size-4 align-middle text-[var(--color-border-main)]" />
        </span>
      }
    />
    <TooltipContent>
      Always verify transaction details.{' '}
      <ExternalLink href={HelpCenterArticle.VERIFY_TX_DETAILS}>Learn more</ExternalLink>.
    </TooltipContent>
  </Tooltip>
)

export default HelpTooltip
