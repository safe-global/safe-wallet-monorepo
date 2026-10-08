import { Typography } from '@/components/ui/typography'
import type { ReactElement, ReactNode } from 'react'

export type SafeListRemoveDialogViewProps = {
  /** The account's address book name, or its address */
  safe: string
  /** Renders the ModalDialog container around the content */
  renderModal: (props: { dialogTitle: string; children: ReactNode }) => ReactNode
  /** Renders the DialogActions container */
  renderActions: (props: {
    className: string
    cancelTestId: string
    confirmLabel: string
    confirmTestId: string
    confirmDestructive: boolean
  }) => ReactNode
}

export function SafeListRemoveDialogView({
  safe,
  renderModal,
  renderActions,
}: SafeListRemoveDialogViewProps): ReactElement {
  return (
    <>
      {renderModal({
        dialogTitle: 'Delete entry',
        children: (
          <>
            <div className="p-6">
              <Typography>
                Are you sure you want to remove the <b>{safe}</b> account?
              </Typography>
            </div>

            {renderActions({
              className: 'p-4 pt-2',
              cancelTestId: 'cancel-btn',
              confirmLabel: 'Delete',
              confirmTestId: 'delete-btn',
              confirmDestructive: true,
            })}
          </>
        ),
      })}
    </>
  )
}
