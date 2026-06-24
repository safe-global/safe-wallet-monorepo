import css from './styles.module.css'
import { Box, Grid, IconButton, Link, SvgIcon, type SvgIconTypeMap, Typography } from '@mui/material'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
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

const ColoredFileIcon = ({ color }: { color: SvgIconTypeMap['props']['color'] }) => (
  <SvgIcon component={FileIcon} inheritViewBox fontSize="small" color={color} sx={{ fill: 'none' }} />
)

const UploadSummary = ({ fileInfo, onRemove }: { fileInfo: FileInfo; onRemove: (() => void) | MouseEventHandler }) => {
  return (
    <Grid
      container
      direction="column"
      sx={{
        gap: 1,
        mt: 3,
      }}
    >
      <Grid
        container
        sx={{
          gap: 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Grid item xs={1}>
          <ColoredFileIcon color="primary" />
        </Grid>
        <Grid item xs={7}>
          {fileInfo.name}
          {fileInfo.additionalInfo && ` - ${fileInfo.additionalInfo}`}
        </Grid>

        <Grid
          item
          xs
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <IconButton onClick={onRemove} size="small">
            <HighlightOffIcon color="primary" />
          </IconButton>
        </Grid>
      </Grid>
      {(fileInfo.summary.length > 0 || fileInfo.error) && (
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          <div data-testid="file-upload-connector" className={css.verticalLine} />
        </Grid>
      )}
      <>
        {fileInfo.summary.map((summaryItem, idx) => (
          <Grid
            key={`${fileInfo.name}${idx}`}
            container
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Grid item xs={1}>
              <ColoredFileIcon color="border" />
            </Grid>
            <Grid item xs>
              <Typography>{summaryItem}</Typography>
            </Grid>
          </Grid>
        ))}
        {fileInfo.error && (
          <Grid
            container
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Grid item xs={1}>
              <ColoredFileIcon color="border" />
            </Grid>
            <Grid item xs>
              <Typography color="error">
                <strong>{fileInfo.error}</strong>
              </Typography>
            </Grid>
          </Grid>
        )}
      </>
    </Grid>
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
    <Box
      data-testid="file-upload-section"
      {...getRootProps()}
      className={css.dropbox}
      sx={{
        cursor: isDragReject ? 'not-allowed' : undefined,
        background: ({ palette }) => `${isDragReject ? palette.error.light : undefined} !important`,
        border: ({ palette }) =>
          `1px dashed ${
            isDragReject ? palette.error.dark : isDragActive ? palette.primary.main : palette.secondary.dark
          }`,
      }}
    >
      {getInputProps && <input {...getInputProps()} />}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <SvgIcon
          component={FileIcon}
          inheritViewBox
          fontSize="small"
          sx={{ fill: 'none', color: ({ palette }) => palette.primary.light }}
        />
        <Typography>
          Drag and drop a {fileType} file or <Link color="secondary">choose a file</Link>
        </Typography>
      </Box>
    </Box>
  )
}

export default FileUpload
