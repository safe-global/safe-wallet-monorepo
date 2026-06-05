import { useCallback, useMemo, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/utils/cn'
import { AB_FILE_SIZE_LIMIT } from '@/components/address-book/ImportDialog/validation'
import type { AddressBookItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

import { parseImportedAddressBook } from './parseImportedAddressBook'

const ACCEPTED_FILE_TYPES = {
  'text/csv': ['.csv'],
  'application/json': ['.json'],
}

const getRejectionError = (rejection?: FileRejection): string => {
  const code = rejection?.errors[0]?.code
  if (code === 'file-too-large') return 'File is too large. Please upload a file smaller than 1MB.'
  if (code === 'too-many-files') return 'Please upload a single file.'
  return 'Unsupported file type. Please upload a CSV or JSON file.'
}

type UploadAddressBookTabProps = {
  supportedChainIds: string[]
  onImport: (items: AddressBookItem[]) => void
  onCancel: () => void
  isSubmitting: boolean
  isSuccess: boolean
  submitError?: string
}

const UploadAddressBookTab = ({
  supportedChainIds,
  onImport,
  onCancel,
  isSubmitting,
  isSuccess,
  submitError,
}: UploadAddressBookTabProps) => {
  const [fileName, setFileName] = useState<string>()
  const [items, setItems] = useState<AddressBookItem[]>([])
  const [error, setError] = useState<string>()

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Reset any previously parsed items so a stale, importable selection can't survive a new drop.
      setItems([])

      if (fileRejections.length > 0) {
        setFileName(undefined)
        setError(getRejectionError(fileRejections[0]))
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      setFileName(file.name)
      setError(undefined)

      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result
        if (typeof content !== 'string') {
          setError('Could not read file')
          return
        }

        try {
          const result = parseImportedAddressBook(file.name, content, supportedChainIds)
          setItems(result.items)
          setError(result.error)
        } catch {
          // Malformed input can make the parser throw; surface a friendly error instead of failing silently.
          setItems([])
          setError('Could not read file')
        }
      }
      reader.onerror = () => setError('Could not read file')
      reader.readAsText(file)
    },
    [supportedChainIds],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    multiple: false,
    maxSize: AB_FILE_SIZE_LIMIT,
    onDrop,
  })

  const chainCount = useMemo(() => new Set(items.flatMap((item) => item.chainIds)).size, [items])

  const canImport = items.length > 0 && !error && !isSubmitting && !isSuccess

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4">
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-primary bg-muted' : 'border-border hover:bg-muted',
          )}
        >
          <input {...getInputProps()} data-testid="ab-file-input" />
          <p className="text-sm font-medium">
            {fileName ? fileName : 'Drag & drop a CSV or JSON file here, or click to browse'}
          </p>
          {items.length > 0 && !error && (
            <p className="text-sm text-muted-foreground">
              Found {items.length} {items.length === 1 ? 'entry' : 'entries'} on {chainCount}{' '}
              {chainCount > 1 ? 'chains' : 'chain'}
            </p>
          )}
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Use a CSV file (with an address, name, chainId header) or a JSON file exported from the app.
        </p>

        {(error || submitError) && (
          <Alert variant="destructive" className="mt-2">
            {error || submitError}
          </Alert>
        )}
      </div>

      <DialogFooter className="flex-row justify-end gap-2 p-4 border-t">
        <Button variant="ghost" data-testid="cancel-btn" onClick={onCancel}>
          Cancel
        </Button>
        <Button data-testid="import-btn" disabled={!canImport} onClick={() => onImport(items)}>
          {isSubmitting ? <Spinner className="size-4" /> : `Import (${items.length})`}
        </Button>
      </DialogFooter>
    </div>
  )
}

export default UploadAddressBookTab
