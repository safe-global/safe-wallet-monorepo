import { useMemo, type ReactElement } from 'react'
import { useForm, Controller, FormProvider } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { subMonths, startOfYear, isBefore, isAfter, startOfDay, addMonths, endOfDay } from 'date-fns'
import ExportIcon from '@/public/images/common/export.svg'
import UpdateIcon from '@/public/images/notifications/update.svg'
import ModalDialog from '@/components/common/ModalDialog'
import DatePickerInput from '@/components/common/DatePickerInput'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppDispatch } from '@/store'
import useChainId from '@/hooks/useChainId'
import type { JobStatusDto } from '@safe-global/store/gateway/AUTO_GENERATED/csv-export'
import { useCsvExportLaunchExportV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/csv-export'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent, MixpanelEventParams } from '@/services/analytics'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'

enum DateRangeOption {
  LAST_30_DAYS = '30d',
  LAST_6_MONTHS = '6m',
  LAST_12_MONTHS = '12m',
  YTD = 'ytd',
  CUSTOM = 'custom',
}

const DATE_RANGE_LABELS: Record<DateRangeOption, string> = {
  [DateRangeOption.LAST_30_DAYS]: 'Last 30 days',
  [DateRangeOption.LAST_6_MONTHS]: 'Last 6 months',
  [DateRangeOption.LAST_12_MONTHS]: 'Last 12 months',
  [DateRangeOption.YTD]: 'Year to date (YTD)',
  [DateRangeOption.CUSTOM]: 'Custom',
}

enum CsvTxExportField {
  RANGE = 'range',
  FROM = 'from',
  TO = 'to',
}

const MAX_RANGE_MONTHS = 12

const getExportDates = (
  range: DateRangeOption,
  from: Date | null,
  to: Date | null,
  now = new Date(),
): { executionDateGte?: string; executionDateLte?: string } => {
  let executionDateGte: string | undefined
  let executionDateLte: string | undefined = endOfDay(now).toISOString()

  switch (range) {
    case DateRangeOption.LAST_30_DAYS:
      executionDateGte = startOfDay(subMonths(now, 1)).toISOString()
      break
    case DateRangeOption.LAST_6_MONTHS:
      executionDateGte = startOfDay(subMonths(now, 6)).toISOString()
      break
    case DateRangeOption.LAST_12_MONTHS:
      executionDateGte = startOfDay(subMonths(now, 12)).toISOString()
      break
    case DateRangeOption.YTD:
      executionDateGte = startOfYear(now).toISOString()
      break
    case DateRangeOption.CUSTOM:
      executionDateGte = from ? startOfDay(from).toISOString() : undefined
      executionDateLte = to ? endOfDay(to).toISOString() : undefined
      break
  }

  return { executionDateGte, executionDateLte }
}

type CsvTxExportForm = {
  [CsvTxExportField.RANGE]: DateRangeOption | ''
  [CsvTxExportField.FROM]: Date | null
  [CsvTxExportField.TO]: Date | null
}

type CsvTxExportModalProps = {
  onClose: () => void
  onExport: (job: JobStatusDto) => void
  hasActiveFilter: boolean
}

const CsvTxExportModal = ({ onClose, onExport, hasActiveFilter }: CsvTxExportModalProps): ReactElement => {
  const dispatch = useAppDispatch()
  const safeAddress = useSafeAddress()
  const chainId = useChainId()
  const [launchExport] = useCsvExportLaunchExportV1Mutation()

  const infoNotification = () => {
    dispatch(
      showNotification({
        variant: 'info',
        groupKey: 'export-csv-started',
        title: 'Generating CSV export',
        message: 'This might take a few minutes.',
        icon: <UpdateIcon />,
      }),
    )
  }

  const errorNotification = () => {
    dispatch(
      showNotification({
        variant: 'error',
        groupKey: 'export-csv-error',
        title: 'Something went wrong',
        message: 'Please try exporting the CSV again.',
      }),
    )
  }

  const methods = useForm<CsvTxExportForm>({
    mode: 'onChange',
    shouldUnregister: true,
    defaultValues: {
      [CsvTxExportField.RANGE]: '',
      [CsvTxExportField.FROM]: null,
      [CsvTxExportField.TO]: null,
    },
  })

  const {
    control,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = methods

  const selectedRange = watch(CsvTxExportField.RANGE)
  const from = watch(CsvTxExportField.FROM)
  const to = watch(CsvTxExportField.TO)

  const isOverYear = !!(from && to && isAfter(to, addMonths(from, MAX_RANGE_MONTHS)))

  const isExportDisabled = useMemo(() => {
    return (
      !selectedRange ||
      (selectedRange === DateRangeOption.CUSTOM && (!from || !to || !!errors.from || !!errors.to)) ||
      isOverYear
    )
  }, [selectedRange, from, to, errors.from, errors.to, isOverYear])

  const onSubmit = handleSubmit(async ({ range, from, to }) => {
    if (!range) return
    const { executionDateGte, executionDateLte } = getExportDates(range, from, to)

    try {
      const job = await launchExport({
        chainId,
        safeAddress,
        transactionExportDto: { executionDateGte, executionDateLte },
      }).unwrap()
      onExport(job)
      infoNotification()
    } catch (e) {
      errorNotification()
    }

    trackEvent(TX_LIST_EVENTS.CSV_EXPORT_SUBMITTED, {
      [MixpanelEventParams.DATE_RANGE]: DATE_RANGE_LABELS[range as DateRangeOption],
    })
    onClose()
  })

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
      <FormProvider {...methods}>
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
              <Controller
                name={CsvTxExportField.RANGE}
                control={control}
                render={({ field }) => (
                  <Select value={field.value || null} onValueChange={(value) => field.onChange(value ?? '')}>
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
                )}
              />
            </div>

            {selectedRange === DateRangeOption.CUSTOM && (
              <div className="mt-4 mb-2 flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <DatePickerInput
                    name={CsvTxExportField.FROM}
                    label="From"
                    deps={[CsvTxExportField.TO]}
                    validate={(val) => {
                      const toDate = getValues(CsvTxExportField.TO)
                      if (val && toDate && isBefore(startOfDay(toDate), startOfDay(val))) {
                        return 'Must be before "To" date'
                      }
                    }}
                  />
                  <DatePickerInput
                    name={CsvTxExportField.TO}
                    label="To"
                    deps={[CsvTxExportField.FROM]}
                    validate={(val) => {
                      const fromDate = getValues(CsvTxExportField.FROM)
                      if (val && fromDate && isAfter(startOfDay(fromDate), startOfDay(val))) {
                        return 'Must be after "From" date'
                      }
                    }}
                  />
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
      </FormProvider>
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
        variant: 'default' as const,
        message: 'You can select up to 12 months.',
      }

  return <Alert variant={variant}>{message}</Alert>
}

export default CsvTxExportModal
