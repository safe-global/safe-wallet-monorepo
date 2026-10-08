import { useCSVReader, formatFileSize } from 'react-papaparse'
import type { ParseResult } from 'papaparse'
import { type ReactElement, useState, type MouseEvent, useMemo } from 'react'

import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { useAppDispatch } from '@/store'
import { trackEvent, ADDRESS_BOOK_EVENTS } from '@/services/analytics'
import { abCsvReaderValidator, abOnUploadValidator } from './validation'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { Errors, logError } from '@/services/exceptions'
import FileUpload, { FileTypes, type FileInfo } from '@/components/common/FileUpload'
import { BRAND_NAME } from '@/config/constants'
import { ImportDialogView, ImportSummaryView } from '@views/components/address-book/ImportDialog/ImportDialogView'

type AddressBookCSVRow = ['address', 'name', 'chainId']

// https://react-papaparse.js.org/docs#errors
type PapaparseErrorType = {
  type: 'Quotes' | 'Delimiter' | 'FieldMismatch'
  code: 'MissingQuotes' | 'UndetectableDelimiter' | 'TooFewFields' | 'TooManyFields'
  message: string
  row?: number
  index?: number
}

const CSV_MIME_TYPE = 'text/csv'

const hasEntry = (entry: string[]) => {
  return entry.length === 3 && entry[0] && entry[1] && entry[2]
}

const ImportDialog = ({ handleClose }: { handleClose: () => void }): ReactElement => {
  const [zoneHover, setZoneHover] = useState<boolean>(false)
  const [csvData, setCsvData] = useState<ParseResult<AddressBookCSVRow>>()
  const [error, setError] = useState<string>()

  // Count how many entries are in the CSV file
  const [entryCount, chainCount] = useMemo(() => {
    if (!csvData) return [0, 0]
    const entries = csvData.data.slice(1).filter(hasEntry)
    const entryLen = entries.length
    const chainLen = new Set(entries.map((entry) => entry[2].trim())).size
    return [entryLen, chainLen]
  }, [csvData])

  const dispatch = useAppDispatch()
  const { CSVReader } = useCSVReader()

  const handleImport = () => {
    if (!csvData) {
      return
    }

    const [, ...entries] = csvData.data

    // One id shared by all rows so the listener collapses them into a single toast.
    const notifyBatchId = crypto.randomUUID()

    for (const entry of entries) {
      const [address, name, chainId] = entry
      dispatch(upsertAddressBookEntries({ address, name, chainIds: [chainId.trim()], notify: true, notifyBatchId }))
    }

    trackEvent({ ...ADDRESS_BOOK_EVENTS.IMPORT, label: entries.length })

    handleClose()
  }

  return (
    <ImportDialogView
      brandName={BRAND_NAME}
      onClose={handleClose}
      onImport={handleImport}
      importDisabled={!csvData || !!error}
      errorMessage={error && <ErrorMessage>{error}</ErrorMessage>}
      uploader={
        <CSVReader
          accept={CSV_MIME_TYPE}
          multiple={false}
          onDragOver={() => {
            setZoneHover(true)
          }}
          onDragLeave={() => {
            setZoneHover(false)
          }}
          validator={abCsvReaderValidator}
          onUploadRejected={(result: { file: File; errors?: Array<Error | string | PapaparseErrorType> }[]) => {
            setZoneHover(false)
            setError(undefined)

            // csvReaderValidator error
            const error = result?.[0].errors?.pop()

            if (error) {
              const errorDescription = typeof error === 'string' ? error.toString() : error.message
              setError(errorDescription)
              logError(Errors._703, errorDescription)
            }
          }}
          onUploadAccepted={(result: ParseResult<['address', 'name', 'chainId']>) => {
            setZoneHover(false)
            setError(undefined)

            // Remove empty rows
            const cleanResult = {
              ...result,
              data: result.data.filter(hasEntry),
            }

            const message = abOnUploadValidator(cleanResult)

            if (message) {
              setError(message)
            } else {
              setCsvData(cleanResult)
            }
          }}
        >
          {/* https://github.com/Bunlong/react-papaparse/blob/master/src/useCSVReader.tsx */}
          {({ getRootProps, acceptedFile, getRemoveFileProps }: any) => {
            const { onClick } = getRemoveFileProps()

            const onRemove = (e: MouseEvent<HTMLSpanElement>) => {
              setCsvData(undefined)
              setError(undefined)
              onClick(e)
            }

            const fileInfo: FileInfo | undefined = acceptedFile
              ? {
                  name: acceptedFile.name,
                  additionalInfo: formatFileSize(acceptedFile.size),
                  summary: [<ImportSummaryView key="abSummary" entryCount={entryCount} chainCount={chainCount} />],
                }
              : undefined

            return (
              <FileUpload
                fileInfo={fileInfo}
                fileType={FileTypes.CSV}
                getRootProps={getRootProps}
                isDragActive={zoneHover}
                onRemove={onRemove}
              />
            )
          }}
        </CSVReader>
      }
    />
  )
}

export default ImportDialog
