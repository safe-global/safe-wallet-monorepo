import { useState, useCallback, useEffect } from 'react'
import {
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Box,
} from '@mui/material'
import ModalDialog from '@/components/common/ModalDialog'
import { useReportFalseResult } from '@/features/safe-shield/hooks/useReportFalseResult'
import type { ReportEvent } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import { trackEvent } from '@/services/analytics'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics/events/safe-shield'

const MAX_DETAILS_LENGTH = 1000

type ReportFalseResultModalProps = {
  open: boolean
  onClose: () => void
  requestId: string
}

export const ReportFalseResultModal = ({ open, onClose, requestId }: ReportFalseResultModalProps) => {
  const [eventType, setEventType] = useState<ReportEvent | ''>('')
  const [details, setDetails] = useState('')
  const { reportFalseResult, isLoading } = useReportFalseResult()

  // Track modal open
  useEffect(() => {
    if (open) {
      trackEvent(SAFE_SHIELD_EVENTS.REPORT_MODAL_OPENED)
    }
  }, [open])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setEventType('')
      setDetails('')
    }
  }, [open])

  const isFormValid = eventType !== '' && details.trim().length > 0 && details.length <= MAX_DETAILS_LENGTH

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || !eventType) return

    const success = await reportFalseResult({
      event: eventType,
      requestId,
      details: details.trim(),
    })

    if (success) {
      onClose()
    }
  }, [isFormValid, eventType, requestId, details, reportFalseResult, onClose])

  const handleEventChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEventType(event.target.value as ReportEvent)
  }

  const handleDetailsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDetails(event.target.value)
  }

  return (
    <ModalDialog open={open} onClose={onClose} dialogTitle="Report incorrect result">
      <DialogContent sx={{ p: '24px !important' }}>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Help us improve our security analysis by reporting when a transaction was incorrectly classified.
        </Typography>

        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
            What type of issue are you reporting?
          </FormLabel>
          <RadioGroup value={eventType} onChange={handleEventChange}>
            <FormControlLabel
              value="FALSE_POSITIVE"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    False positive
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This transaction was incorrectly flagged as dangerous
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 1 }}
            />
            <FormControlLabel
              value="FALSE_NEGATIVE"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    False negative
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This transaction should have been flagged but wasn&apos;t
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start' }}
            />
          </RadioGroup>
        </FormControl>

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
