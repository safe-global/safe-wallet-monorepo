import { Alert, AlertAction, AlertDescription, AlertSeverityIcon } from '@safe-global/design/components/ui/alert'
import { Button } from '@safe-global/design/components/ui/button'

const SafeLimitError = ({ onRetry }: { onRetry: () => void }) => (
  <Alert variant="destructive" className="shrink-0" data-testid="safe-limit-error">
    <AlertSeverityIcon variant="destructive" />
    <AlertDescription>
      We couldn&apos;t load how many Safe accounts your plan allows. You can add more once it loads.
    </AlertDescription>
    <AlertAction>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </AlertAction>
  </Alert>
)

export default SafeLimitError
