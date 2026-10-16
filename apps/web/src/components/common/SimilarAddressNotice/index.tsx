import type { ReactElement, ReactNode } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'

export { SimilarAddressTooltip } from './SimilarAddressTooltip'

/** Red one-liner under an address field or file summary, e.g. "This address is similar to <name> in …". */
export const SimilarAddressNotice = ({ children }: { children: ReactNode }): ReactElement => (
  <Alert variant="destructive" outlined={false}>
    <AlertSeverityIcon variant="destructive" />
    <AlertDescription>{children}</AlertDescription>
  </Alert>
)
