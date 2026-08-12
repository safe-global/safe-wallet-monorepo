import css from './styles.module.css'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import FileIcon from '@/public/images/settings/data/file.svg'
import type { MouseEventHandler, ReactElement } from 'react'
import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone'

export type FileInfo = {
  name: string
  additionalInfo?: string
  summary: ReactElement[]
  error?: string
}

export enum FileTypes {
  JSON = 'JSON',
  CSV = 'CSV',
}

const ColoredFileIcon = ({ className }: { className?: string }) => (
  <FileIcon className={`size-5 fill-none ${className ?? ''}`} />
)

const UploadSummary = ({ fileInfo, onRemove }: { fileInfo: FileInfo; onRemove: (() => void) | MouseEventHandler }) => {
  return (
    <div className="mt-6 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="basis-1/12">
          <ColoredFileIcon className="text-[var(--color-primary-main)]" />
        </div>
        <div className="basis-7/12">
          {fileInfo.name}
          {fileInfo.additionalInfo && ` - ${fileInfo.additionalInfo}`}
        </div>

        <div className="flex flex-1 justify-end">
          <Button variant="ghost" size="icon-sm" onClick={onRemove}>
            <XCircle className="text-[var(--color-primary-main)]" />
          </Button>
        </div>
      </div>
      <div className="flex justify-start">
        <div className={css.verticalLine} />
      </div>
      <>
        {fileInfo.summary.map((summaryItem, idx) => (
          <div key={`${fileInfo.name}${idx}`} className="flex items-center gap-2">
            <div className="basis-1/12">
              <ColoredFileIcon className="text-[var(--color-border-main)]" />
            </div>
            <div className="flex-1">
              <Typography>{summaryItem}</Typography>
            </div>
          </div>
        ))}
        {fileInfo.error && (
          <div className="flex items-center gap-2">
            <div className="basis-1/12">
              <ColoredFileIcon className="text-[var(--color-border-main)]" />
            </div>
            <div className="flex-1">
              <Typography className="text-[var(--color-error-main)]">
                <strong>{fileInfo.error}</strong>
              </Typography>
            </div>
          </div>
        )}
      </>
    </div>
  )
}

const FileUpload = ({
  getRootProps,
  getInputProps,
  isDragReject = false,
  isDragActive = false,
  fileType,
  fileInfo,
  onRemove,
}: {
  isDragReject?: boolean
  isDragActive?: boolean
  fileType: FileTypes
  getInputProps?: <T extends DropzoneInputProps>(props?: T | undefined) => T
  getRootProps: <T extends DropzoneRootProps>(props?: T | undefined) => T
  fileInfo?: FileInfo
  onRemove: (() => void) | MouseEventHandler
}) => {
  if (fileInfo) {
    return <UploadSummary fileInfo={fileInfo} onRemove={onRemove} />
  }
  return (
    <div
      data-testid="file-upload-section"
      {...getRootProps()}
      className={css.dropbox}
      style={{
        cursor: isDragReject ? 'not-allowed' : undefined,
        background: isDragReject ? 'var(--color-error-light)' : undefined,
        border: `1px dashed ${
          isDragReject
            ? 'var(--color-error-dark)'
            : isDragActive
              ? 'var(--color-primary-main)'
              : 'var(--color-secondary-dark)'
        }`,
      }}
    >
      {getInputProps && <input {...getInputProps()} />}
      <div className="flex items-center gap-2">
        <FileIcon className="size-5 fill-none text-[var(--color-primary-light)]" />
        <Typography>
          Drag and drop a {fileType} file or <Link variant="muted">choose a file</Link>
        </Typography>
      </div>
    </div>
  )
}

export default FileUpload
