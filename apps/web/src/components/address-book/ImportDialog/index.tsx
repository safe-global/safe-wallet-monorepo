import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useCSVReader, formatFileSize } from 'react-papaparse'
import type { ParseResult } from 'papaparse'
import { type ReactElement, useState, type MouseEvent, useMemo } from 'react'

import ModalDialog from '@/components/common/ModalDialog'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { useAppDispatch } from '@/store'

import css from './styles.module.css'
import { trackEvent, ADDRESS_BOOK_EVENTS } from '@/services/analytics'
import { abCsvReaderValidator, abOnUploadValidator } from './validation'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { Errors, logError } from '@/services/exceptions'
import FileUpload, { FileTypes, type FileInfo } from '@/components/common/FileUpload'
import ExternalLink from '@/components/common/ExternalLink'
import { BRAND_NAME } from '@/config/constants'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

type AddressBookCSVRow = ['address', 'name', 'chainId']

// https://react-papaparse.js.org/docs#errors
type PapaparseErrorType = {
  type: 'Quotes' | 'Delimiter' | 'FieldMismatch'
  code: 'MissingQuotes' | 'UndetectableDelimiter' | 'TooFewFields' | 'TooManyFields'
  message: string
  row?: number
  index?: number
}

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

    for (const entry of entries) {
      const [address, name, chainId] = entry
      dispatch(upsertAddressBookEntries({ address, name, chainIds: [chainId.trim()] }))
    }

    trackEvent({ ...ADDRESS_BOOK_EVENTS.IMPORT, label: entries.length })

    handleClose()
  }

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Import address book" hideChainIndicator>
      <DialogContent>
        <CSVReader
          accept="text/csv"
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
                  summary: [
                    <Typography data-testid="summary-message" key="abSummary">
                      {`Found ${entryCount} entries on ${chainCount} ${chainCount > 1 ? 'chains' : 'chain'}`}
                    </Typography>,
                  ],
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

        <div className={css.horizontalDivider} />

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Typography>
          Only CSV files exported from a {BRAND_NAME} can be imported.
          <br />
          <ExternalLink
            href={HelpCenterArticle.ADDRESS_BOOK_DATA}
            title="Learn about the address book import and export"
          >
            Learn about the address book import and export
          </ExternalLink>
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button data-testid="cancel-btn" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          data-testid="import-btn"
          onClick={handleImport}
          variant="contained"
          disableElevation
          disabled={!csvData || !!error}
        >
          Import
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}

export default ImportDialog
