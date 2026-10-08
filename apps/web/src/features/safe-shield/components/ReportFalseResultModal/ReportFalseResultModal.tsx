import { useState, useCallback, useEffect } from 'react'
import { useReportFalseResult } from '../../hooks/useReportFalseResult'
import { trackEvent } from '@/services/analytics'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics/events/safe-shield'
import { ReportFalseResultModalView } from '@views/features/safe-shield/components/ReportFalseResultModal/ReportFalseResultModalView'

const MAX_DETAILS_LENGTH = 1000

type ReportFalseResultModalProps = {
  open: boolean
  onClose: () => void
  requestId: string
}

export const ReportFalseResultModal = ({ open, onClose, requestId }: ReportFalseResultModalProps) => {
  const [details, setDetails] = useState('')
  const { reportFalseResult, isLoading } = useReportFalseResult()

  useEffect(() => {
    if (open) {
      trackEvent(SAFE_SHIELD_EVENTS.REPORT_MODAL_OPENED)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setDetails('')
    }
  }, [open])

  const isFormValid = details.trim().length > 0 && details.length <= MAX_DETAILS_LENGTH
  const isError = details.length > MAX_DETAILS_LENGTH

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return

    trackEvent(SAFE_SHIELD_EVENTS.REPORT_SUBMITTED)

    const success = await reportFalseResult({
      request_id: requestId,
      details: details.trim(),
    })

    if (success) {
      onClose()
    }
  }, [isFormValid, requestId, details, reportFalseResult, onClose])

  const handleDetailsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDetails(event.target.value)
  }

  return (
    <ReportFalseResultModalView
      open={open}
      onClose={onClose}
      details={details}
      onDetailsChange={handleDetailsChange}
      maxDetailsLength={MAX_DETAILS_LENGTH}
      isError={isError}
      isFormValid={isFormValid}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  )
}
