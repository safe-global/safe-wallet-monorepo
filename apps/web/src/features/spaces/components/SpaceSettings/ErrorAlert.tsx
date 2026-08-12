import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ReactElement } from 'react'

const ErrorAlert = ({ error }: { error?: string }): ReactElement | null => {
  if (!error) {
    return null
  }

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}

export default ErrorAlert
