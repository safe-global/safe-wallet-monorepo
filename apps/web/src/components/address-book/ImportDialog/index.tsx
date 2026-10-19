import { Typography } from '@safe-global/views/components/ui/typography'
import { useCSVReader, formatFileSize } from 'react-papaparse'
import type { ParseResult } from 'papaparse'
import { type ReactElement, useState, type MouseEvent, useMemo } from 'react'

import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { SimilarAddressNotice } from '@/components/common/SimilarAddressNotice'
import SelectAllConfirmDialog from '@/components/common/TrustedSafesModal/SelectAllConfirmDialog'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { useAppDispatch } from '@/store'

import css from './styles.module.css'
import {
  trackEvent,
  ADDRESS_BOOK_EVENTS,
  ADDRESS_POISONING_EVENTS,
  LookalikeWarningLocation,
  MixpanelEventParams,
} from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { useAddressPoisoningBatchCheck } from '@/features/address-poisoning'
import { abCsvReaderValidator, abOnUploadValidator } from './validation'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { Errors, logError } from '@/services/exceptions'
import FileUpload, { FileTypes, type FileInfo } from '@safe-global/views/components/common/FileUpload'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
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

const LOOKALIKE_TRACKING = { [MixpanelEventParams.LOCATION]: LookalikeWarningLocation.ADDRESS_BOOK_IMPORT }

const pluralize = (count: number, singular: string, plural: string) => (count === 1 ? singular : plural)

const ImportDialog = ({ handleClose }: { handleClose: () => void }): ReactElement => {
  const [zoneHover, setZoneHover] = useState<boolean>(false)
  const [csvData, setCsvData] = useState<ParseResult<AddressBookCSVRow>>()
  const [error, setError] = useState<string>()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Count how many entries are in the CSV file
  const [entryCount, chainCount] = useMemo(() => {
    if (!csvData) return [0, 0]
    const entries = csvData.data.slice(1).filter(hasEntry)
    const entryLen = entries.length
    const chainLen = new Set(entries.map((entry) => entry[2].trim())).size
    return [entryLen, chainLen]
  }, [csvData])

  // Rows below the header; addresses that look like a saved one or like another row get flagged.
  const entries = useMemo(() => csvData?.data.slice(1) ?? [], [csvData])
  const addresses = useMemo(() => entries.map(([address]) => address.trim()), [entries])
  const flagged = useAddressPoisoningBatchCheck(addresses)
  const isFlagged = ([address]: AddressBookCSVRow) => flagged.has(address.trim().toLowerCase())

  // One row per flagged address, even when the file lists it on several chains.
  const flaggedEntries = useMemo(() => {
    const byAddress = new Map<string, { address: string; name: string }>()
    for (const [address, name] of entries) {
      const key = address.trim().toLowerCase()
      if (flagged.has(key) && !byAddress.has(key)) byAddress.set(key, { address: address.trim(), name })
    }
    return Array.from(byAddress.values())
  }, [entries, flagged])

  useTrackOnce(ADDRESS_POISONING_EVENTS.WARNING_SHOWN, LOOKALIKE_TRACKING, flaggedEntries.length > 0)

  const dispatch = useAppDispatch()
  const { CSVReader } = useCSVReader()

  const importEntries = (rows: AddressBookCSVRow[]) => {
    // One id shared by all rows so the listener collapses them into a single toast.
    const notifyBatchId = crypto.randomUUID()

    for (const entry of rows) {
      const [address, name, chainId] = entry
      dispatch(upsertAddressBookEntries({ address, name, chainIds: [chainId.trim()], notify: true, notifyBatchId }))
    }

    trackEvent({ ...ADDRESS_BOOK_EVENTS.IMPORT, label: rows.length })

    handleClose()
  }

  const handleImport = () => {
    if (!csvData) {
      return
    }

    if (flaggedEntries.length > 0) {
      setIsConfirmOpen(true)
      return
    }

    importEntries(entries)
  }

  const onImportLookalikes = () => {
    trackEvent(ADDRESS_POISONING_EVENTS.WARNING_CONTINUED, LOOKALIKE_TRACKING)
    importEntries(entries)
  }

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Import address book" hideChainIndicator>
      <div className="px-6 py-5">
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

        {flaggedEntries.length > 0 && (
          <div className="mt-4">
            <SimilarAddressNotice>
              {flaggedEntries.length} {pluralize(flaggedEntries.length, 'address', 'addresses')} in this file{' '}
              {pluralize(flaggedEntries.length, 'looks', 'look')} similar to other addresses.
            </SimilarAddressNotice>
          </div>
        )}

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
      </div>
      <DialogActions
        className="p-6 pt-2"
        onCancel={handleClose}
        cancelTestId="cancel-btn"
        confirmLabel="Import"
        onConfirm={handleImport}
        confirmDisabled={!csvData || !!error}
        confirmTestId="import-btn"
      />

      <SelectAllConfirmDialog
        open={isConfirmOpen}
        similarAddresses={flaggedEntries}
        description={`${flaggedEntries.length} ${pluralize(flaggedEntries.length, 'address', 'addresses')} in this file closely ${pluralize(flaggedEntries.length, 'resembles', 'resemble')} other addresses. Review them carefully before continuing.`}
        question="Do you want to import these addresses?"
        confirmLabel="Yes, import them anyway"
        onConfirm={onImportLookalikes}
        onSkip={() => importEntries(entries.filter((entry) => !isFlagged(entry)))}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </ModalDialog>
  )
}

export default ImportDialog
