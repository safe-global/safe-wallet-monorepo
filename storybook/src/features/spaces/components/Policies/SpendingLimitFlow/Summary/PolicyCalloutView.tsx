import type { ReactElement, ReactNode } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'

export type PolicyCalloutViewProps = {
  title: ReactNode
  description: ReactNode
}

export const PolicyCalloutView = ({ title, description }: PolicyCalloutViewProps): ReactElement => (
  <Alert variant="info" data-testid="spending-limit-summary-callout">
    <AlertSeverityIcon variant="info" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{description}</AlertDescription>
  </Alert>
)
