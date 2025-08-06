import { type ReactElement } from 'react'
import { useForm, Controller, FormProvider } from 'react-hook-form'
import {
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  MenuItem,
  Box,
  Grid,
  SvgIcon,
  FormControl,
  FormLabel,
  Alert,
} from '@mui/material'
import { subDays, subMonths, startOfYear, isBefore, isAfter, startOfDay, addMonths } from 'date-fns'
import ExportIcon from '@/public/images/common/export.svg'
import ModalDialog from '@/components/common/ModalDialog'
import DatePickerInput from '@/components/common/DatePickerInput'
import useSafeAddress from '@/hooks/useSafeAddress'
import useChainId from '@/hooks/useChainId'
import type { JobStatusDto } from '@safe-global/store/gateway/AUTO_GENERATED/csv-export'
import { useCsvExportLaunchExportV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/csv-export'

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

type CsvExportForm = {
  range: DateRangeOption | null
  from: Date | null
  to: Date | null
}

type CsvExportModalProps = {
  onClose: () => void
  onExport?: (job: JobStatusDto) => void
  hasActiveFilter?: boolean
}

const CsvExportModal = ({ onClose, onExport, hasActiveFilter }: CsvExportModalProps): ReactElement => {
  const safeAddress = useSafeAddress()
  const chainId = useChainId()
  const [launchExport] = useCsvExportLaunchExportV1Mutation()

  const methods = useForm<CsvExportForm>({
    mode: 'onChange',
    defaultValues: {
      range: null,
      from: null,
      to: null,
    },
  })

  const {
    control,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = methods

  const selectedRange = watch('range')
  const from = watch('from')
  const to = watch('to')
  const isExportDisabled =
    !selectedRange || (selectedRange === DateRangeOption.CUSTOM && (!from || !to || !!errors.from || !!errors.to))

  const onSubmit = handleSubmit(async ({ range, from, to }) => {
    const now = new Date()
    let executionDateGte: string | undefined
    let executionDateLte: string | undefined = now.toISOString()

    //TODO check for range not null ?
    switch (range) {
      case DateRangeOption.LAST_30_DAYS:
        executionDateGte = subDays(now, 30).toISOString() //TODO should be 1 month instead of exact 30 days
        break
      case DateRangeOption.LAST_6_MONTHS:
        executionDateGte = subMonths(now, 6).toISOString()
        break
      case DateRangeOption.LAST_12_MONTHS:
        executionDateGte = subMonths(now, 12).toISOString()
        break
      case DateRangeOption.YTD:
        executionDateGte = startOfYear(now).toISOString()
        break
      case DateRangeOption.CUSTOM:
        executionDateGte = from ? from.toISOString() : undefined //TODO defaults ?
        executionDateLte = to ? to.toISOString() : undefined
        break
    }

    //TODO store response for later use in polling status
    try {
      const job = await launchExport({
        chainId,
        safeAddress,
        transactionExportDto: { executionDateGte, executionDateLte },
      }).unwrap()
      onExport?.(job)
      console.info('Export launched: ', job)
    } catch (e) {
      //TODO proper handling
      console.error(e)
    }

    onClose()
  })

  return (
    <ModalDialog open onClose={onClose} dialogTitle="Export CSV" hideChainIndicator>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent sx={{ p: '24px !important' }}>
            <Typography variant="body2" mb={3}>
              The CSV includes transactions from the selected period, suitable for reporting.
            </Typography>

            {hasActiveFilter && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Transaction history filters won&apos;t apply here.
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 1 }}>
              <FormLabel sx={{ mb: 1, fontSize: 14 }}>Date Range</FormLabel>
              <Controller
                name="range"
                control={control}
                render={({ field }) => (
                  //TODO placeholder is not shown
                  //TODO fontSize 14
                  <TextField select focused={false} placeholder="Choose a date range" fullWidth required {...field}>
                    {Object.values(DateRangeOption).map((option) => (
                      <MenuItem sx={{ fontSize: 14 }} key={option} value={option}>
                        {DATE_RANGE_LABELS[option]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </FormControl>

            {selectedRange === DateRangeOption.CUSTOM && (
              <Box mt={2} mb={1} display="flex" flexDirection="column" gap={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    {/* TODO fontSize 14 */}
                    <DatePickerInput
                      name="from"
                      label="From"
                      deps={['to']}
                      validate={(val) => {
                        const toDate = getValues('to')
                        if (val && toDate && isBefore(startOfDay(toDate), startOfDay(val))) {
                          return 'Must be before "To" date'
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DatePickerInput
                      name="to"
                      label="To"
                      deps={['from']}
                      validate={(val) => {
                        const fromDate = getValues('from')
                        if (val && fromDate) {
                          if (isAfter(startOfDay(fromDate), startOfDay(val))) {
                            return 'Must be after "From" date'
                          }
                          //TODO check for the last active field if possible
                          if (val > addMonths(fromDate, 12)) {
                            return 'Date range cannot exceed 12 months'
                          }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
                <Alert severity="info">You can select up to 12 months.</Alert>
              </Box>
            )}
          </DialogContent>

          {/* TODO onSubmt callback ++ move button to the left */}
          <DialogActions sx={{ p: 3 }}>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={isExportDisabled} // TODO based on dates
              disableElevation
              startIcon={<SvgIcon component={ExportIcon} inheritViewBox fontSize="small" />}
            >
              Export
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default CsvExportModal
