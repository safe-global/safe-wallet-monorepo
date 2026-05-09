import { Button, SvgIcon, Tooltip } from '@mui/material'
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
    <Tooltip title="Review security report on Hypernative" arrow placement="top" onClick={onBtnClick}>
      <Button variant="neutral" fullWidth component={ExternalLink} href={href}>
        <SvgIcon component={HypernativeIcon} inheritViewBox className={css.hypernativeIcon} />
        {text}
      </Button>
    </Tooltip>
  )
}

export default HnSecurityReportBtn
