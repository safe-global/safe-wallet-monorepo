import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'

type WizardNoticeProps = {
  title: string
  body: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  testId?: string
}

/** A note above the first onboarding step about work the user left unfinished. */
const WizardNotice = ({
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  testId,
}: WizardNoticeProps) => (
  <Alert variant="info" data-testid={testId}>
    <AlertSeverityIcon variant="info" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>
      <p>{body}</p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={onPrimary}>
          {primaryLabel}
        </Button>
        {secondaryLabel && onSecondary && (
          <Button size="sm" variant="outline" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </AlertDescription>
  </Alert>
)

export default WizardNotice
