import type { ReactElement } from 'react'
import type { PermissionRequest } from '@safe-global/safe-apps-sdk/dist/types/types/permissions'
import { ModalDialogTitle } from '@/components/common/ModalDialog'
import { getSafePermissionDisplayValues } from '@/hooks/safe-apps/permissions'
import { PermissionsPromptView } from '@views/components/safe-apps/PermissionsPromptView'

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
    <PermissionsPromptView
      origin={origin}
      isOpen={isOpen}
      permissionDescriptions={permissions.map(
        (permission) => getSafePermissionDisplayValues(Object.keys(permission)[0]).description,
      )}
      onReject={() => onReject(requestId)}
      onAccept={() => onAccept(origin, requestId)}
      onCloseTitle={() => onReject()}
      renderModalDialogTitle={(props) => <ModalDialogTitle {...props} />}
    />
  )
}

export default PermissionsPrompt
