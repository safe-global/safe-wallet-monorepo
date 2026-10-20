import type { ReactNode } from 'react'
import { captureError } from '@/services/observability'
import ObservabilityErrorBoundary from '.'

const reportError = (error: Error, componentStack?: string) => {
  captureError({ error, isUserFacing: true, tags: { componentStack } })
}

const ParsingErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ObservabilityErrorBoundary onError={reportError} fallback={<div>Error parsing data</div>}>
    {children}
  </ObservabilityErrorBoundary>
)

export default ParsingErrorBoundary
