import type { ReactElement, ReactNode } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'

export type PermissionsPromptViewProps = {
  origin: string
  isOpen: boolean
  permissionDescriptions: string[]
  onReject: () => void
  onAccept: () => void
  renderModalDialogTitle: (props: { onClose: () => void; children: ReactNode }) => ReactNode
  onCloseTitle: () => void
}

export function PermissionsPromptView({
  origin,
  isOpen,
  permissionDescriptions,
  onReject,
  onAccept,
  renderModalDialogTitle,
  onCloseTitle,
}: PermissionsPromptViewProps): ReactElement {
  return (
    <Dialog open={isOpen}>
      <DialogContent showCloseButton={false} padding="none">
        {renderModalDialogTitle({
          onClose: onCloseTitle,
          children: (
            <Typography variant="paragraph-bold" as="span">
              Permissions Request
            </Typography>
          ),
        })}
        <Separator />
        <div className="px-6 py-4">
          <Typography>
            <b>{origin}</b> is requesting permissions for:
          </Typography>
          <ul className="mt-4 flex list-disc flex-col gap-1 pl-10">
            {permissionDescriptions.map((description, index) => (
              <li key={index}>
                <Typography>{description}</Typography>
              </li>
            ))}
          </ul>
        </div>
        <div className="my-6 flex justify-center gap-2">
          <Button variant="destructive" size="sm" onClick={onReject} className="min-w-[130px]">
            Reject
          </Button>
          <Button variant="default" size="sm" onClick={onAccept} className="min-w-[130px]">
            Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
