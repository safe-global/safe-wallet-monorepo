import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import type { ReactElement } from 'react'

const ErrorAlert = ({ error }: { error?: string }): ReactElement | null => {
  if (!error) {
    return null
  }

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertSeverityIcon variant="destructive" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}

export default ErrorAlert
