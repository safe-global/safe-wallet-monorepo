import { useMemo, type ReactElement } from 'react'
import { useForm, Controller, FormProvider } from 'react-hook-form'
import { subMonths, startOfYear, isBefore, isAfter, startOfDay, addMonths, endOfDay } from 'date-fns'
import UpdateIcon from '@/public/images/notifications/update.svg'
import DatePickerInput from '@/components/common/DatePickerInput'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppDispatch } from '@/store'
import useChainId from '@/hooks/useChainId'
import type { JobStatusDto } from '@safe-global/store/gateway/AUTO_GENERATED/csv-export'
import { useCsvExportLaunchExportV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/csv-export'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent, MixpanelEventParams } from '@/services/analytics'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import {
  CsvTxExportModalView,
  DATE_RANGE_LABELS,
  DateRangeOption,
} from '@views/components/transactions/CsvTxExportModal/CsvTxExportModalView'

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
    <FormProvider {...methods}>
      <CsvTxExportModalView
        onClose={onClose}
        onSubmit={onSubmit}
        hasActiveFilter={hasActiveFilter}
        selectedRange={selectedRange}
        isOverYear={isOverYear}
        isExportDisabled={isExportDisabled}
        renderRangeField={(render) => (
          <Controller name={CsvTxExportField.RANGE} control={control} render={({ field }) => render(field)} />
        )}
        renderFromDate={({ label, invalidMessage }) => (
          <DatePickerInput
            name={CsvTxExportField.FROM}
            label={label}
            deps={[CsvTxExportField.TO]}
            validate={(val) => {
              const toDate = getValues(CsvTxExportField.TO)
              if (val && toDate && isBefore(startOfDay(toDate), startOfDay(val))) {
                return invalidMessage
              }
            }}
          />
        )}
        renderToDate={({ label, invalidMessage }) => (
          <DatePickerInput
            name={CsvTxExportField.TO}
            label={label}
            deps={[CsvTxExportField.FROM]}
            validate={(val) => {
              const fromDate = getValues(CsvTxExportField.FROM)
              if (val && fromDate && isAfter(startOfDay(fromDate), startOfDay(val))) {
                return invalidMessage
              }
            }}
          />
        )}
      />
    </FormProvider>
  )
}

export default CsvTxExportModal
