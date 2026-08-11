import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import HypernativeIcon from '@/public/images/hypernative/hypernative-icon.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { hnSecurityReportBtnConfig } from './config'
import type { ReactElement } from 'react'
import { HYPERNATIVE_EVENTS, trackEvent } from '@/services/analytics'
import { buildSecurityReportUrl } from '@/features/hypernative/utils/buildSecurityReportUrl'

import css from './styles.module.css'

interface HnSecurityReportBtnProps {
  chainId: string
  safe: string
  tx: string
}

const onBtnClick = () => {
  setTimeout(() => {
    trackEvent(HYPERNATIVE_EVENTS.SECURITY_REPORT_CLICKED)
  }, 300)
}

const HnSecurityReportBtn = ({ chainId, safe, tx }: HnSecurityReportBtnProps): ReactElement => {
  const { text, baseUrl } = hnSecurityReportBtnConfig

  const href = buildSecurityReportUrl(baseUrl, chainId, safe, tx)

  return (
    // Click event is sent to mixpanel as well via the GA_TO_MIXPANEL_MAPPING in services/analytics/)
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="secondary" className="w-full" onClick={onBtnClick} render={<ExternalLink href={href} />}>
            <span className={css.hypernativeIcon}>
              <HypernativeIcon />
            </span>
            {text}
          </Button>
        }
      />
      <TooltipContent>Review security report on Hypernative</TooltipContent>
    </Tooltip>
  )
}

export default HnSecurityReportBtn
