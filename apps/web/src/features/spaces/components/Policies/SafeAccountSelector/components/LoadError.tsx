import { AlertCircle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { LOAD_ERROR_TEXT } from '../constants'
import PopupMessage from './PopupMessage'

/** The eligible accounts could not be loaded. Same shape as the empty state, but in an error tone. */
const LoadError = ({ onRetry }: { onRetry?: () => void }) => (
  <PopupMessage
    data-testid="safe-accounts-load-error"
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
      {LOAD_ERROR_TEXT}
    </Typography>
  </PopupMessage>
)

export default LoadError
