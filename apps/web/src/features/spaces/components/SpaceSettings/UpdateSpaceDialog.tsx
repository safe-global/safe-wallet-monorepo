import ModalDialog from '@/components/common/ModalDialog'
import UpdateSpaceForm from './UpdateSpaceForm'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Typography } from '@/components/ui/typography'
import { AppRoutes } from '@/config/routes'
import ExternalLink from '@/components/common/ExternalLink'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'

const UpdateSpaceDialog = ({ space, onClose }: { space: GetSpaceResponse; onClose: () => void }) => {
  const isDarkMode = useDarkMode()

  return (
    <ModalDialog dialogTitle="Update workspace" hideChainIndicator open onClose={onClose}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="mt-4 px-6 pb-6">
          <Typography className="mb-4">
            The workspace name is visible in the sidebar menu, headings to all its members. Usually it&apos;s a name of
            the company or a business. <ExternalLink href={AppRoutes.privacy}>How is this data stored?</ExternalLink>
          </Typography>
          <UpdateSpaceForm space={space} onClose={onClose} />
        </div>
      </div>
    </ModalDialog>
  )
}

export default UpdateSpaceDialog
