import { hnSecurityReportBtnConfig } from '@views/features/hypernative/components/HnSecurityReportBtn/config'
import type { ReactElement } from 'react'
import { HYPERNATIVE_EVENTS, trackEvent } from '@/services/analytics'
import { buildSecurityReportUrl } from '@/features/hypernative/utils/buildSecurityReportUrl'
import { HnSecurityReportBtnView } from '@views/features/hypernative/components/HnSecurityReportBtn/HnSecurityReportBtnView'

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
  const { baseUrl } = hnSecurityReportBtnConfig

  const href = buildSecurityReportUrl(baseUrl, chainId, safe, tx)

  // Click event is sent to mixpanel as well via the GA_TO_MIXPANEL_MAPPING in services/analytics/
  return <HnSecurityReportBtnView href={href} onClick={onBtnClick} />
}

export default HnSecurityReportBtn
