import { Box, Button, DialogContent, Typography } from '@mui/material'
import ModalDialog from '@/components/common/ModalDialog'

interface CaptchaModalProps {
  open: boolean
  onWidgetContainerReady: (container: HTMLDivElement | null) => void
  error?: Error | null
  onRetry?: () => void
}

const CaptchaModal = ({ open, onWidgetContainerReady, error, onRetry }: CaptchaModalProps) => {
  return (
    <ModalDialog
      open={open}
      hideChainIndicator
      dialogTitle="Security check"
      // Keep mounted so the widget container stays in DOM for Turnstile to render into
      keepMounted
    >
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={2}>
          {error ? (
            <>
              <Typography variant="body1" color="error">
                Verification failed. Please try again.
              </Typography>

              {onRetry && (
                <Button variant="contained" onClick={onRetry}>
                  Retry
                </Button>
              )}
            </>
          ) : (
            <Typography variant="body1" color="text.secondary">
              Please complete the check below.
            </Typography>
          )}

          <Box ref={onWidgetContainerReady} />
        </Box>
      </DialogContent>
    </ModalDialog>
  )
}

export default CaptchaModal
