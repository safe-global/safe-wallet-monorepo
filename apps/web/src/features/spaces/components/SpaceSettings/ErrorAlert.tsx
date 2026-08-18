import { Alert, AlertDescription } from '@/components/ui/alert'
import { CircleAlert } from 'lucide-react'
import type { ReactElement } from 'react'

const ErrorAlert = ({ error }: { error?: string }): ReactElement | null => {
  if (!error) {
    return null
  }

  return (
    <Alert variant="destructive" className="mt-4">
      <CircleAlert />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}

export default ErrorAlert
