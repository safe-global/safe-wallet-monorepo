import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import ModalDialog from '@/components/common/ModalDialog'
import { useReportFalseResult } from '@/features/safe-shield/hooks/useReportFalseResult'
import { trackEvent } from '@/services/analytics'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics/events/safe-shield'

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
    <ModalDialog open={open} onClose={onClose} dialogTitle="Report false result" hideChainIndicator>
      <div className="p-6">
        <Typography variant="paragraph-small" className="mb-6 block text-[var(--color-text-secondary)]">
          Help us improve our security analysis by reporting when a transaction was incorrectly flagged as dangerous.
        </Typography>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-false-result-details">Details</Label>
          <Textarea
            id="report-false-result-details"
            placeholder="Please describe why you believe this result is incorrect..."
            rows={4}
            value={details}
            onChange={handleDetailsChange}
            maxLength={MAX_DETAILS_LENGTH}
            aria-invalid={isError}
            required
          />
          <Typography
            variant="paragraph-mini"
            className={isError ? 'text-[var(--color-error-main)]' : 'text-[var(--color-text-secondary)]'}
          >
            {`${details.length}/${MAX_DETAILS_LENGTH} characters`}
          </Typography>
        </div>
      </div>

      <div className="flex flex-row justify-end gap-2 p-6 pt-0">
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!isFormValid || isLoading}>
          {isLoading ? <Spinner className="size-5" /> : 'Submit report'}
        </Button>
      </div>
    </ModalDialog>
  )
}
