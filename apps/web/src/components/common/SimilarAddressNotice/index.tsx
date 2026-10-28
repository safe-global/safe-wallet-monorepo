import type { ReactElement, ReactNode } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'

export { SimilarAddressTooltip } from './SimilarAddressTooltip'

export const SimilarAddressNotice = ({ children }: { children: ReactNode }): ReactElement => (
  <Alert variant="destructive" outlined={false}>
    <AlertSeverityIcon variant="destructive" />
    <AlertDescription>{children}</AlertDescription>
  </Alert>
)
