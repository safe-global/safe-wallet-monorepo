import UpdateSpaceForm from './UpdateSpaceForm'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useDarkMode } from '@/hooks/useDarkMode'
import { UpdateSpaceDialogView } from '@views/features/spaces/components/SpaceSettings/UpdateSpaceDialogView'

const UpdateSpaceDialog = ({ space, onClose }: { space: GetSpaceResponse; onClose: () => void }) => {
  const isDarkMode = useDarkMode()

  return (
    <UpdateSpaceDialogView
      isDarkMode={isDarkMode}
      onClose={onClose}
      form={<UpdateSpaceForm space={space} onClose={onClose} />}
    />
  )
}

export default UpdateSpaceDialog
