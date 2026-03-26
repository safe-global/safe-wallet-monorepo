import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCw } from 'lucide-react'

type SafeSelectorErrorProps = {
  onRetry?: () => void
}

function SafeSelectorError({ onRetry }: SafeSelectorErrorProps) {
  return (
    <Alert
      variant="destructive"
      // TODO: change rounded-lg (8px) to rounded-2xl (16px) after migrating to the new design system
      className="w-auto min-h-[68px] rounded-lg shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] *:[svg]:row-span-1 *:[svg]:translate-y-0 *:[svg]:self-center"
    >
      <AlertCircle />
      <AlertTitle className="flex items-center justify-between gap-4">
        Failed to load Safe data
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRetry}
          >
            <RotateCw className="size-3.5" />
            Retry
          </Button>
        )}
      </AlertTitle>
    </Alert>
  )
}

export default SafeSelectorError
