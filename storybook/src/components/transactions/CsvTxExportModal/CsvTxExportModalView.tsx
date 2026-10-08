import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import ExportIcon from '@/public/images/common/export.svg'
import ModalDialog from '@/components/common/ModalDialog'

export enum DateRangeOption {
  LAST_30_DAYS = '30d',
  LAST_6_MONTHS = '6m',
  LAST_12_MONTHS = '12m',
  YTD = 'ytd',
  CUSTOM = 'custom',
}

export const DATE_RANGE_LABELS: Record<DateRangeOption, string> = {
  [DateRangeOption.LAST_30_DAYS]: 'Last 30 days',
  [DateRangeOption.LAST_6_MONTHS]: 'Last 6 months',
  [DateRangeOption.LAST_12_MONTHS]: 'Last 12 months',
  [DateRangeOption.YTD]: 'Year to date (YTD)',
  [DateRangeOption.CUSTOM]: 'Custom',
}

export type DateRangeField = {
  value: DateRangeOption | ''
  onChange: (value: DateRangeOption | '') => void
}

export type DateFieldRender = (props: { label: string; invalidMessage: string }) => ReactNode

export type CsvTxExportModalViewProps = {
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  hasActiveFilter: boolean
  selectedRange: DateRangeOption | ''
  isOverYear: boolean
  isExportDisabled: boolean
  renderRangeField: (render: (field: DateRangeField) => ReactElement) => ReactNode
  renderFromDate: DateFieldRender
  renderToDate: DateFieldRender
}

export const CsvTxExportModalView = ({
  onClose,
  onSubmit,
  hasActiveFilter,
  selectedRange,
  isOverYear,
  isExportDisabled,
  renderRangeField,
  renderFromDate,
  renderToDate,
}: CsvTxExportModalViewProps): ReactElement => {
  return (
    <ModalDialog
      open
      onClose={onClose}
      dialogTitle={
        <>
          <ExportIcon className="mr-2 inline size-4" />
          Export CSV
        </>
      }
      hideChainIndicator
      maxWidth="xs"
    >
      <form onSubmit={onSubmit}>
        <div className="p-6">
          <Typography className="mb-6">
            The CSV includes transactions from the selected period, suitable for reporting.
          </Typography>

          {hasActiveFilter && (
            <Alert className="mb-6 bg-[var(--color-background-main)]">
              Transaction history filters won&apos;t apply here.
            </Alert>
          )}

          <div className="mb-2 flex w-full flex-col gap-1.5">
            <Label htmlFor="csv-export-range">Date range</Label>
            {renderRangeField((field) => (
              <Select
                items={DATE_RANGE_LABELS}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? '')}
              >
                <SelectTrigger id="csv-export-range" aria-label="Date range" className="w-full">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DateRangeOption).map((option) => (
                    <SelectItem key={option} value={option}>
                      {DATE_RANGE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>

          {selectedRange === DateRangeOption.CUSTOM && (
            <div className="mt-4 mb-2 flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {renderFromDate({ label: 'From', invalidMessage: 'Must be before "To" date' })}
                {renderToDate({ label: 'To', invalidMessage: 'Must be after "From" date' })}
              </div>
              <YearRangeAlert isOverYear={isOverYear} />
            </div>
          )}
        </div>

        <div className="flex justify-end p-4">
          <Button type="submit" variant="default" size="sm" disabled={isExportDisabled}>
            <ExportIcon className="size-4" />
            Export
          </Button>
        </div>
      </form>
    </ModalDialog>
  )
}

const YearRangeAlert = ({ isOverYear }: { isOverYear: boolean }): ReactElement => {
  const { variant, message } = isOverYear
    ? {
        variant: 'warning' as const,
        message: 'Date range cannot exceed 12 months.',
      }
    : {
        variant: 'info' as const,
        message: 'You can select up to 12 months.',
      }

  return (
    <Alert variant={variant} outlined={false}>
      <AlertSeverityIcon variant={variant} />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
