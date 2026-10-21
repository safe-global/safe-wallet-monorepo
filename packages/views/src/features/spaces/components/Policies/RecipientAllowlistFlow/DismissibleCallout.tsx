import type { ReactElement } from 'react'
import AllowlistAlert from './AllowlistAlert'

type DismissibleCalloutProps = {
  title: string
  description: string
  onDismiss: () => void
  'data-testid'?: string
}

const DismissibleCallout = ({
  title,
  description,
  onDismiss,
  'data-testid': testId,
}: DismissibleCalloutProps): ReactElement => (
  // mb-1 evens the gap below with the one above, where the section title's line height adds 4px
  <AllowlistAlert
    tone="warning"
    title={title}
    description={description}
    onDismiss={onDismiss}
    className="mb-1"
    data-testid={testId}
  />
)

export default DismissibleCallout
