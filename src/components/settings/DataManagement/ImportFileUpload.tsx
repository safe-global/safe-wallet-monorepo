import { useDropzone } from 'react-dropzone'
import { Typography, SvgIcon } from '@mui/material'
import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import FileUpload, { FileTypes } from '@/components/common/FileUpload'
import InfoIcon from '@/public/images/notifications/info.svg'

const AcceptedMimeTypes = {
  'application/json': ['.json'],
}

export const ImportFileUpload = ({
  setFileName,
  setJsonData,
}: {
  setFileName: Dispatch<SetStateAction<string | undefined>>
  setJsonData: Dispatch<SetStateAction<string | undefined>>
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        return
      }
      const file = acceptedFiles[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (!event.target) {
          return
        }
        if (typeof event.target.result !== 'string') {
          return
        }
        setFileName(file.name)
        setJsonData(event.target.result)
      }
      reader.readAsText(file)
    },
    [setFileName, setJsonData],
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    maxFiles: 1,
    onDrop,
    accept: AcceptedMimeTypes,
  })

  const onRemove = () => {
    setFileName(undefined)
    setJsonData(undefined)
  }

  return (
    <>
      <Typography>Import {'Superchain Account'} data by uploading a file in the area below.</Typography>

      <FileUpload
        fileType={FileTypes.JSON}
        getRootProps={() => ({ ...getRootProps(), height: '228px' })}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
        isDragReject={isDragReject}
        onRemove={onRemove}
      />

      <Typography>
        <SvgIcon
          component={InfoIcon}
          inheritViewBox
          fontSize="small"
          color="border"
          sx={{
            verticalAlign: 'middle',
            mr: 0.5,
          }}
        />
        Only JSON files exported from the {'Superchain Account'} can be imported.
      </Typography>
    </>
  )
}
