import { AlertCircle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { LOAD_ERROR_TEXT } from '../SafeAccountSelector/constants'
import PopupMessage from './PopupMessage'

/** A popup list that failed to load. Same shape as the empty state, in an error tone. */
const LoadError = ({
  message = LOAD_ERROR_TEXT,
  onRetry,
  'data-testid': testId = 'safe-accounts-load-error',
}: {
  message?: string
  onRetry?: () => void
  'data-testid'?: string
}) => (
  <PopupMessage
    data-testid={testId}
    action={
      onRetry && (
        <Button variant="destructive" size="sm" onClick={onRetry}>
          <RotateCw className="size-3.5" />
          Retry
        </Button>
      )
    }
  >
    <AlertCircle className="text-destructive size-4 shrink-0 translate-y-0.5" />
    <Typography variant="paragraph-small" className="text-destructive w-full">
      {message}
    </Typography>
  </PopupMessage>
)

export default LoadError
