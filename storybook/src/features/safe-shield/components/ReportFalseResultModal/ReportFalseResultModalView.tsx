import type { ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import ModalDialog from '@/components/common/ModalDialog'

export type ReportFalseResultModalViewProps = {
  open: boolean
  onClose: () => void
  details: string
  onDetailsChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  maxDetailsLength: number
  isError: boolean
  isFormValid: boolean
  isLoading: boolean
  onSubmit: () => void
}

export const ReportFalseResultModalView = ({
  open,
  onClose,
  details,
  onDetailsChange,
  maxDetailsLength,
  isError,
  isFormValid,
  isLoading,
  onSubmit,
}: ReportFalseResultModalViewProps) => {
  return (
    <ModalDialog open={open} onClose={onClose} dialogTitle="Report false result" hideChainIndicator>
      <div className="p-6">
        <Typography variant="paragraph-small" className="mb-6 block text-[var(--color-text-secondary)]">
          Help us improve our security analysis by reporting when a transaction was incorrectly flagged as dangerous.
        </Typography>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-false-result-details">Details</Label>
          <Textarea
            id="report-false-result-details"
            placeholder="Please describe why you believe this result is incorrect..."
            rows={4}
            value={details}
            onChange={onDetailsChange}
            maxLength={maxDetailsLength}
            aria-invalid={isError}
            required
          />
          <Typography
            variant="paragraph-mini"
            className={isError ? 'text-[var(--color-error-main)]' : 'text-[var(--color-text-secondary)]'}
          >
            {`${details.length}/${maxDetailsLength} characters`}
          </Typography>
        </div>
      </div>

      <div className="flex flex-row justify-between gap-2 p-6 pt-0">
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!isFormValid || isLoading}>
          {isLoading ? <Spinner className="size-5" /> : 'Submit report'}
        </Button>
      </div>
    </ModalDialog>
  )
}
