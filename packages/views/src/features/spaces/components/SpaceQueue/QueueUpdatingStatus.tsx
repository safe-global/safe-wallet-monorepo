import type { ReactElement } from 'react'

type QueueUpdatingStatusProps = {
  /** The queue on screen answers an earlier search or filter while the new one loads */
  isStale: boolean
}

/** Says why the dimmed queue can't be used; sits in the gap above it, so the table doesn't move */
const QueueUpdatingStatus = ({ isStale }: QueueUpdatingStatusProps): ReactElement => (
  // Always rendered, so screen readers announce the text when it appears
  <p role="status" className="absolute -top-5 left-0 text-xs text-muted-foreground">
    {isStale ? 'Updating results…' : ''}
  </p>
)

export default QueueUpdatingStatus
