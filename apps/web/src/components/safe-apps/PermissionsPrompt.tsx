import type { ReactElement } from 'react'
import type { PermissionRequest } from '@safe-global/safe-apps-sdk/dist/types/types/permissions'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import { ModalDialogTitle } from '@/components/common/ModalDialog'
import { getSafePermissionDisplayValues } from '@/hooks/safe-apps/permissions'

interface PermissionsPromptProps {
  origin: string
  isOpen: boolean
  requestId: string
  permissions: PermissionRequest[]
  onReject: (requestId?: string) => void
  onAccept: (origin: string, requestId: string) => void
}

const PermissionsPrompt = ({
  origin,
  isOpen,
  requestId,
  permissions,
  onReject,
  onAccept,
}: PermissionsPromptProps): ReactElement => {
  return (
    <Dialog open={isOpen}>
      <DialogContent showCloseButton={false} padding="none">
        <ModalDialogTitle onClose={() => onReject()}>
          <Typography variant="paragraph-bold">Permissions Request</Typography>
        </ModalDialogTitle>
        <Separator />
        <div className="px-6 py-4">
          <Typography>
            <b>{origin}</b> is requesting permissions for:
          </Typography>
          <ul>
            {permissions.map((permission, index) => (
              <li key={index}>
                <Typography>{getSafePermissionDisplayValues(Object.keys(permission)[0]).description}</Typography>
              </li>
            ))}
          </ul>
        </div>
        <div className="my-6 flex justify-center gap-2">
          <Button variant="destructive" size="sm" onClick={() => onReject(requestId)} className="min-w-[130px]">
            Reject
          </Button>
          <Button variant="default" size="sm" onClick={() => onAccept(origin, requestId)} className="min-w-[130px]">
            Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PermissionsPrompt
