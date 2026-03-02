import { useState, useCallback, useEffect } from 'react'
import { Button, CircularProgress, DialogActions, DialogContent, TextField, Typography } from '@mui/material'
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

  const handleDetailsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDetails(event.target.value)
  }

  return (
    <ModalDialog open={open} onClose={onClose} dialogTitle="Report false result" hideChainIndicator>
      <DialogContent sx={{ p: '24px !important' }}>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Help us improve our security analysis by reporting when a transaction was incorrectly flagged as dangerous.
        </Typography>

        <TextField
          label="Details"
          placeholder="Please describe why you believe this result is incorrect..."
          multiline
          rows={4}
          fullWidth
          value={details}
          onChange={handleDetailsChange}
          inputProps={{ maxLength: MAX_DETAILS_LENGTH }}
          helperText={`${details.length}/${MAX_DETAILS_LENGTH} characters`}
          error={details.length > MAX_DETAILS_LENGTH}
          required
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isFormValid || isLoading} disableElevation>
          {isLoading ? <CircularProgress size={20} /> : 'Submit report'}
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}
