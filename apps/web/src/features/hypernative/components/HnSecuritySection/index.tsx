import type { ReactElement } from 'react'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useHnQueueAssessmentResult } from '../../hooks/useHnQueueAssessmentResult'
import { useShowHypernativeAssessment } from '../../hooks/useShowHypernativeAssessment'
import { useHypernativeOAuth } from '../../hooks/useHypernativeOAuth'
import { useIsHypernativeQueueScanFeature } from '../../hooks/useIsHypernativeQueueScanFeature'
import { HnQueueAssessmentBanner } from '../HnQueueAssessmentBanner'
import HnSecurityReportBtnForTxDetails from '../HnSecurityReportBtn/HnSecurityReportBtnForTxDetails'

interface HnSecuritySectionProps {
  txDetails: TransactionDetails
  safeTxHash: string | undefined
  chainId: string | undefined
}

const HnSecuritySection = ({ txDetails, safeTxHash, chainId }: HnSecuritySectionProps): ReactElement | null => {
  const assessment = useHnQueueAssessmentResult(safeTxHash)
  const { isAuthenticated } = useHypernativeOAuth()
  const showAssessmentBanner = useShowHypernativeAssessment()
  const isHypernativeQueueScanEnabled = useIsHypernativeQueueScanFeature()

  if (!safeTxHash || !chainId) {
    return null
  }

  if (!isHypernativeQueueScanEnabled) {
    return <HnSecurityReportBtnForTxDetails txDetails={txDetails} />
  }

  if (!showAssessmentBanner) {
    return null
  }

  return <HnQueueAssessmentBanner safeTxHash={safeTxHash} assessment={assessment} isAuthenticated={isAuthenticated} />
}

export default HnSecuritySection
