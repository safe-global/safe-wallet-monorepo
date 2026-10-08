import { Alert, AlertTitle, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { ReactElement, ReactNode } from 'react'

import ModalDialog from '@/components/common/ModalDialog'
import FileIcon from '@/public/images/settings/data/file.svg'
import type { FileListCardHeaderProps } from './FileListCardView'

import css from './styles.module.css'

export type ImportDialogViewProps = {
  showUpload: boolean
  fileName: string
  isDisabled: boolean
  upload: ReactNode
  renderFileList: (props: FileListCardHeaderProps & { className?: string }) => ReactNode
  onClose: () => void
  onImport: () => void
}

export const ImportDialogView = ({
  showUpload,
  fileName,
  isDisabled,
  upload,
  renderFileList,
  onClose,
  onImport,
}: ImportDialogViewProps): ReactElement => {
  return (
    <ModalDialog open onClose={onClose} dialogTitle="Data import" hideChainIndicator>
      <div className="p-6">
        {showUpload ? (
          <div className="mt-4">{upload}</div>
        ) : (
          <>
            {renderFileList({
              avatar: (
                <div className="rounded">
                  <FileIcon className="block size-4 fill-none" />
                </div>
              ),
              title: <b>{fileName}</b>,
              className: css.header,
            })}
            {!isDisabled && (
              <Alert variant="warning" outlined={false}>
                <AlertSeverityIcon variant="warning" />
                <AlertTitle className="font-bold">Overwrite your current data?</AlertTitle>
                <AlertDescription>
                  This action will overwrite your currently added Safe accounts, address book and settings with those
                  from the imported file.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
      <div className="flex justify-between gap-2 p-6 pt-0">
        <Button data-testid="dialog-cancel-btn" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button data-testid="dialog-import-btn" onClick={onImport} disabled={isDisabled}>
          Import
        </Button>
      </div>
    </ModalDialog>
  )
}
