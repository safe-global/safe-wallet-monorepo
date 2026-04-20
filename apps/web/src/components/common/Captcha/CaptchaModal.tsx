import { Box, Button, DialogContent, Typography } from '@mui/material'
import ModalDialog from '@/components/common/ModalDialog'
import SafeLogo from '@/public/images/logo-no-text.svg'

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
      // Keep mounted so the widget container stays in DOM for Turnstile to render into
      keepMounted
    >
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={3} pt={4} pb={3}>
          <SafeLogo alt="Safe logo" width={56} height={56} />

          <Box textAlign="center">
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Let us know it&apos;s you
            </Typography>

            <Typography variant="body2" color="text.secondary" maxWidth={360} mx="auto">
              A quick check to confirm you&apos;re human — it helps us deliver the highest level of security.
            </Typography>
          </Box>

          {error ? (
            <>
              <Typography variant="body2" color="error">
                Verification failed. Please try again.
              </Typography>

              {onRetry && (
                <Button variant="contained" onClick={onRetry}>
                  Retry
                </Button>
              )}
            </>
          ) : null}

          <Box ref={onWidgetContainerReady} />
        </Box>
      </DialogContent>
    </ModalDialog>
  )
}

export default CaptchaModal
