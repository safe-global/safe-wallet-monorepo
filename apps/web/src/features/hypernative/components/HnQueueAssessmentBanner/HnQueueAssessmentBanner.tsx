import { type ReactElement } from 'react'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useHypernativeOAuth } from '../../hooks/useHypernativeOAuth'
import { useAssessmentUrl } from '../../hooks/useAssessmentUrl'
import { useHnAssessmentSeverity } from '../../hooks/useHnAssessmentSeverity'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import { HnQueueAssessmentBannerView } from '@views/features/hypernative/components/HnQueueAssessmentBanner/HnQueueAssessmentBannerView'

interface HnQueueAssessmentBannerProps {
  safeTxHash: string
  assessment: AsyncResult<ThreatAnalysisResults> | undefined
  isAuthenticated: boolean
}

export const HnQueueAssessmentBanner = ({
  safeTxHash,
  assessment,
  isAuthenticated,
}: HnQueueAssessmentBannerProps): ReactElement | null => {
  const { initiateLogin } = useHypernativeOAuth()
  const severity = useHnAssessmentSeverity(assessment)
  const assessmentUrl = useAssessmentUrl(safeTxHash)

  const handleLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    e.stopPropagation()
    trackEvent(HYPERNATIVE_EVENTS.HYPERNATIVE_LOGIN_CLICKED, {
      [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Queue,
    })
    initiateLogin()
  }

  const handleViewDetails = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation()
    trackEvent(HYPERNATIVE_EVENTS.SECURITY_REPORT_CLICKED)
  }

  return (
    <HnQueueAssessmentBannerView
      isAuthenticated={isAuthenticated}
      severity={severity}
      assessmentUrl={assessmentUrl}
      onLogin={handleLogin}
      onViewDetails={handleViewDetails}
    />
  )
}
