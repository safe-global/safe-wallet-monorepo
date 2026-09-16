import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
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
      <div className="p-6">
        <div className="flex flex-col items-center gap-6 pt-8 pb-6">
          <SafeLogo alt="Safe logo" width={56} height={56} />

          <div className="text-center">
            <Typography variant="h4" align="center" className="mb-2 font-bold">
              Let us know it&apos;s you
            </Typography>

            <Typography
              variant="paragraph-small"
              align="center"
              className="mx-auto max-w-[360px] text-muted-foreground"
            >
              A quick check to confirm you&apos;re human — it helps us deliver the highest level of security.
            </Typography>
          </div>

          {error ? (
            <>
              <Typography variant="paragraph-small" className="text-destructive">
                Verification failed. Please try again.
              </Typography>

              {onRetry && <Button onClick={onRetry}>Retry</Button>}
            </>
          ) : null}

          <div ref={onWidgetContainerReady} />
        </div>
      </div>
    </ModalDialog>
  )
}

export default CaptchaModal
