import { useDropzone } from 'react-dropzone'
import { Alert, AlertAction, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import FileUpload, { FileTypes } from '@safe-global/views/components/common/FileUpload'
import ImportReview, { type ImportDecision, type ImportReviewRow } from './ImportReview'

export const MAX_IMPORT_FILE_SIZE = 1024 * 1024

type ImportDialogProps = {
  /** Workspace signers not in the book yet; offers a shortcut to "Import signers". */
  missingSignerCount?: number
  onImportSigners?: () => void
  /** The app reads and classifies the file, then passes the rows back as `reviewRows`. */
  onFileSelected: (file: File) => void
  fileError?: string
  /** Classified rows of the chosen file. Present = the review step. */
  reviewRows?: ImportReviewRow[]
  bookLabel?: string
  onConfirm: (rows: { row: ImportReviewRow; decision: ImportDecision }[]) => void
  /** Leaves the review step for another file. */
  onBack: () => void
  onClose: () => void
  isSubmitting?: boolean
}

/** Import from a CSV: choose a file, then review every row before anything is written. */
const ImportDialog = ({
  missingSignerCount = 0,
  onImportSigners,
  onFileSelected,
  fileError,
  reviewRows,
  bookLabel = 'the workspace address book',
  onConfirm,
  onBack,
  onClose,
  isSubmitting,
}: ImportDialogProps) => {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    multiple: false,
    maxSize: MAX_IMPORT_FILE_SIZE,
    onDrop: (accepted) => accepted[0] && onFileSelected(accepted[0]),
  })

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent padding="none" size={reviewRows ? 'md' : 'default'}>
        <DialogHeader divided>
          <DialogTitle className="text-xl font-bold">Import address book</DialogTitle>
        </DialogHeader>

        {reviewRows ? (
          <ImportReview
            rows={reviewRows}
            bookLabel={bookLabel}
            onConfirm={onConfirm}
            onBack={onBack}
            isSubmitting={isSubmitting}
          />
        ) : (
          <>
            <div className="flex flex-col gap-4 p-6">
              {missingSignerCount > 0 && onImportSigners && (
                <Alert variant="info">
                  <AlertSeverityIcon variant="info" />
                  <AlertDescription>
                    {missingSignerCount} {missingSignerCount === 1 ? 'signer' : 'signers'} of your workspace Safes{' '}
                    {missingSignerCount === 1 ? 'is' : 'are'} not in the address book.
                  </AlertDescription>
                  <AlertAction>
                    <Button variant="outline" size="sm" onClick={onImportSigners}>
                      Import signers
                    </Button>
                  </AlertAction>
                </Alert>
              )}
              <p className="text-muted-foreground text-sm">
                Upload a CSV with the columns address, name and chainId, and optionally tags separated by semicolons.
                You review every contact before it is imported.
              </p>
              <FileUpload
                fileType={FileTypes.CSV}
                getRootProps={getRootProps}
                getInputProps={getInputProps}
                isDragActive={isDragActive}
                isDragReject={isDragReject}
                onRemove={() => undefined}
                className="h-40"
              />
              {fileError && (
                <Alert variant="destructive">
                  <AlertSeverityIcon variant="destructive" />
                  <AlertDescription>{fileError}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter divided className="flex-row justify-end">
              <Button variant="outline" size="submit" onClick={onClose}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ImportDialog
