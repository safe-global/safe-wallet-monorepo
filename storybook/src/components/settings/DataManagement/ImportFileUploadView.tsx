import { Typography } from '@/components/ui/typography'
import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone'

import FileUpload, { FileTypes } from '@/components/common/FileUpload'
import InfoIcon from '@/public/images/notifications/info.svg'

export type ImportFileUploadViewProps = {
  brandName: string
  getRootProps: <T extends DropzoneRootProps>(props?: T | undefined) => T
  getInputProps: <T extends DropzoneInputProps>(props?: T | undefined) => T
  isDragActive: boolean
  isDragReject: boolean
  onRemove: () => void
}

export const ImportFileUploadView = ({
  brandName,
  getRootProps,
  getInputProps,
  isDragActive,
  isDragReject,
  onRemove,
}: ImportFileUploadViewProps) => {
  return (
    <>
      <Typography>Import {brandName} data by uploading a file in the area below.</Typography>

      <FileUpload
        fileType={FileTypes.JSON}
        getRootProps={getRootProps}
        className="h-[228px]"
        getInputProps={getInputProps}
        isDragActive={isDragActive}
        isDragReject={isDragReject}
        onRemove={onRemove}
      />

      <Typography>
        <InfoIcon className="mr-1 inline size-4 align-middle text-muted-foreground" />
        Only JSON files exported from the {brandName} can be imported.
      </Typography>
    </>
  )
}
