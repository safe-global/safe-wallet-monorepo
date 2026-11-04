import type { ReactNode } from 'react'
import { captureRenderError } from '@/services/observability'
import ObservabilityErrorBoundary from '.'

const ParsingErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ObservabilityErrorBoundary onError={captureRenderError} fallback={<div>Error parsing data</div>}>
    {children}
  </ObservabilityErrorBoundary>
)

export default ParsingErrorBoundary
