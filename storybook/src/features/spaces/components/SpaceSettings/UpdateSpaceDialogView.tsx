import type { ReactNode } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import { Typography } from '@/components/ui/typography'
import { PRIVACY_URL } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { cn } from '@/utils/cn'

export type UpdateSpaceDialogViewProps = {
  isDarkMode: boolean
  onClose: () => void
  form: ReactNode
}

export const UpdateSpaceDialogView = ({ isDarkMode, onClose, form }: UpdateSpaceDialogViewProps) => {
  return (
    <ModalDialog dialogTitle="Update Workspace" hideChainIndicator open onClose={onClose}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="mt-4 px-6 pb-6">
          <Typography className="mb-4">
            The Workspace name is visible in the sidebar menu, headings to all its members. Usually it&apos;s a name of
            the company or a business. <ExternalLink href={PRIVACY_URL}>How is this data stored?</ExternalLink>
          </Typography>
          {form}
        </div>
      </div>
    </ModalDialog>
  )
}
