import type { ReactNode, Ref } from 'react'
import { MigrateToL2Information } from '@views/components/tx/confirmation-views/MigrateToL2Information'

export type ConfirmationViewsViewProps = {
  decodedDataRef: Ref<HTMLDivElement>
  children: ReactNode
}

/** Wraps the decoded data so the confirmation view can tell whether TxData rendered it. */
export const ConfirmationViewsView = ({ decodedDataRef, children }: ConfirmationViewsViewProps) => (
  <div ref={decodedDataRef}>{children}</div>
)

export const MigrateToL2QueueView = () => <MigrateToL2Information variant="queue" />
