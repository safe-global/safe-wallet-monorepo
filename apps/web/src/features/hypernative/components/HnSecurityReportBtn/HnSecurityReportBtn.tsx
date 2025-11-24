import { Button, SvgIcon, Tooltip } from '@mui/material'
import HypernativeIcon from '@/public/images/hypernative/hypernative-icon.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { hnSecurityReportBtnConfig } from './config'
import type { ReactElement } from 'react'
import { HYPERNATIVE_EVENTS, trackEvent } from '@/services/analytics'

import css from './styles.module.css'

interface HnSecurityReportBtnProps {
  chainId: string
  safe: string
  tx: string
}

const buildSecurityReportUrl = (baseUrl: string, chainId: string, safe: string, tx: string): string => {
  const url = new URL(baseUrl)
  url.searchParams.set('chain', `evm:${chainId}`)
  url.searchParams.set('safe', safe)
  url.searchParams.set('tx', tx)
  url.searchParams.set('referrer', 'safe')
  return url.toString()
}

const onBtnClick = () => {
  setTimeout(() => {
    trackEvent(HYPERNATIVE_EVENTS.SECURITY_REPORT_CLICKED)
  }, 300)
}

export const HnSecurityReportBtn = ({ chainId, safe, tx }: HnSecurityReportBtnProps): ReactElement => {
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
