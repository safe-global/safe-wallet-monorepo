import type { ReactElement, ReactNode } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

export type RemoveCustomAppModalViewProps = {
  open: boolean
  app: SafeAppData
  onClose: () => void
  onConfirm: (appId: number) => void
  renderModalDialog: (props: {
    open: boolean
    onClose: () => void
    dialogTitle: string
    children: ReactNode
  }) => ReactNode
}

export function RemoveCustomAppModalView({
  open,
  onClose,
  onConfirm,
  app,
  renderModalDialog,
}: RemoveCustomAppModalViewProps): ReactElement {
  return (
    <>
      {renderModalDialog({
        open,
        onClose,
        dialogTitle: 'Confirm Safe App removal',
        children: (
          <>
            <div className="px-6 pb-4">
              <Typography variant="h4" className="pt-6">
                Are you sure you want to remove the <b>{app.name}</b> app?
              </Typography>
            </div>
            <div className="flex justify-between gap-2 p-6 pt-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => onConfirm(app.id)}>
                Remove
              </Button>
            </div>
          </>
        ),
      })}
    </>
  )
}
