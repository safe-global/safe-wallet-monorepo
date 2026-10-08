import { IS_PRODUCTION } from '@/config/constants'
import { ErrorBoundaryView } from '@views/components/common/ErrorBoundary/ErrorBoundaryView'

interface ErrorBoundaryProps {
  error: Error
  componentStack: string
}

const ErrorBoundary = ({ error, componentStack }: ErrorBoundaryProps) => {
  return <ErrorBoundaryView error={error} componentStack={componentStack} isProduction={IS_PRODUCTION} />
}

export default ErrorBoundary
