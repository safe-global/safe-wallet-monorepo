import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import RadioGroup from '@mui/material/RadioGroup'
import FormLabel from '@mui/material/FormLabel'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import { isBefore, isAfter, startOfDay } from 'date-fns'
import { Controller, FormProvider, useForm, useFormState, type DefaultValues } from 'react-hook-form'
import { useMemo, type ReactElement } from 'react'

import AddressBookInput from '@/components/common/AddressBookInput'
import DatePickerInput from '@/components/common/DatePickerInput'
import { validateAmount } from '@safe-global/utils/utils/validation'
import { trackEvent } from '@/services/analytics'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import { txFilter, useTxFilter, TxFilterType, type TxFilter } from '@/utils/tx-history-filter'
import { useCurrentChain } from '@/hooks/useChains'
import NumberField from '@/components/common/NumberField'

import css from './styles.module.css'
import inputCss from '@/styles/inputs.module.css'
import AddressInput from '@/components/common/AddressInput'

enum TxFilterFormFieldNames {
  FILTER_TYPE = 'type',
  DATE_FROM = 'execution_date__gte',
  DATE_TO = 'execution_date__lte',
  RECIPIENT = 'to',
  AMOUNT = 'value',
  TOKEN_ADDRESS = 'token_address',
  MODULE = 'module',
  NONCE = 'nonce',
}

export type TxFilterFormState = {
  [TxFilterFormFieldNames.FILTER_TYPE]: TxFilterType
  [TxFilterFormFieldNames.DATE_FROM]: Date | null
  [TxFilterFormFieldNames.DATE_TO]: Date | null
  [TxFilterFormFieldNames.RECIPIENT]: string
  [TxFilterFormFieldNames.AMOUNT]: string
  [TxFilterFormFieldNames.TOKEN_ADDRESS]: string
  [TxFilterFormFieldNames.MODULE]: string
  [TxFilterFormFieldNames.NONCE]: string
}

const defaultValues: DefaultValues<TxFilterFormState> = {
  [TxFilterFormFieldNames.FILTER_TYPE]: TxFilterType.INCOMING,
  [TxFilterFormFieldNames.DATE_FROM]: null,
  [TxFilterFormFieldNames.DATE_TO]: null,
  [TxFilterFormFieldNames.RECIPIENT]: '',
  [TxFilterFormFieldNames.AMOUNT]: '',
  [TxFilterFormFieldNames.TOKEN_ADDRESS]: '',
  [TxFilterFormFieldNames.MODULE]: '',
  [TxFilterFormFieldNames.NONCE]: '',
}

const getInitialFormValues = (filter: TxFilter | null): DefaultValues<TxFilterFormState> => {
  return filter
    ? {
        ...defaultValues,
        ...txFilter.formatFormData(filter),
      }
    : defaultValues
}

const TxFilterForm = ({ toggleFilter }: { toggleFilter: () => void }): ReactElement => {
  const [filter, setFilter] = useTxFilter()
  const chain = useCurrentChain()

  const formMethods = useForm<TxFilterFormState>({
    mode: 'onChange',
    shouldUnregister: true,
    defaultValues: getInitialFormValues(filter),
  })

  const { control, watch, handleSubmit, reset, getValues } = formMethods

  const filterType = watch(TxFilterFormFieldNames.FILTER_TYPE)

  const isIncomingFilter = filterType === TxFilterType.INCOMING
  const isMultisigFilter = filterType === TxFilterType.MULTISIG
  const isModuleFilter = filterType === TxFilterType.MODULE

  // Only subscribe to relevant `formState`
  const { dirtyFields, isValid } = useFormState({ control })

  const dirtyFieldNames = Object.keys(dirtyFields)

  const canClear = useMemo(() => {
    const isFormDirty = dirtyFieldNames.some((name) => name !== TxFilterFormFieldNames.FILTER_TYPE)
    const hasFilterInQuery = !!filter?.type
    return !isValid || isFormDirty || hasFilterInQuery
  }, [dirtyFieldNames, filter?.type, isValid])

  const clearFilter = () => {
    setFilter(null)

    reset({
      ...defaultValues,
      // Persist the current type
      [TxFilterFormFieldNames.FILTER_TYPE]: getValues(TxFilterFormFieldNames.FILTER_TYPE),
    })
  }

  const onSubmit = (data: TxFilterFormState) => {
    for (const name of dirtyFieldNames) {
      trackEvent({ ...TX_LIST_EVENTS.FILTER, label: name })
    }

    const filterData = txFilter.parseFormData(data)

    setFilter(filterData)

    toggleFilter()
  }

  return (
    <Paper elevation={0} variant="outlined" className={css.filterWrapper}>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid data-testid="filter-modal" container>
            <Grid item xs={12} md={3} sx={{ p: 4 }}>
              <FormControl>
                <FormLabel sx={{ mb: 2, color: ({ palette }) => palette.primary.light }}>Transaction type</FormLabel>
                <Controller
                  name={TxFilterFormFieldNames.FILTER_TYPE}
                  control={control}
                  render={({ field }) => (
                    <RadioGroup {...field}>
                      {Object.values(TxFilterType).map((value) => (
                        <FormControlLabel value={value} control={<Radio />} label={value} key={value} />
                      ))}
                    </RadioGroup>
                  )}
                />
              </FormControl>
            </Grid>

            <Divider orientation="vertical" flexItem />

            <Grid item xs={12} md={8} sx={{ p: 4 }}>
              <FormControl sx={{ width: '100%' }}>
                <FormLabel sx={{ mb: 3, color: ({ palette }) => palette.primary.light }}>Parameters</FormLabel>
                <Grid container item spacing={2} xs={12}>
                  {!isModuleFilter && (
                    <>
                      <Grid data-testid="start-date" item xs={12} md={6}>
                        <DatePickerInput
                          name={TxFilterFormFieldNames.DATE_FROM}
                          label="From"
                          deps={[TxFilterFormFieldNames.DATE_TO]}
                          validate={(val: TxFilterFormState[TxFilterFormFieldNames.DATE_FROM]) => {
                            const toDate = getValues(TxFilterFormFieldNames.DATE_TO)
                            if (val && toDate && isBefore(startOfDay(toDate), startOfDay(val))) {
                              return 'Must be before "To" date'
                            }
                          }}
                        />
                      </Grid>
                      <Grid data-testid="end-date" item xs={12} md={6}>
                        <DatePickerInput
                          name={TxFilterFormFieldNames.DATE_TO}
                          label="To"
                          deps={[TxFilterFormFieldNames.DATE_FROM]}
                          validate={(val: TxFilterFormState[TxFilterFormFieldNames.DATE_FROM]) => {
                            const fromDate = getValues(TxFilterFormFieldNames.DATE_FROM)
                            if (val && fromDate && isAfter(startOfDay(fromDate), startOfDay(val))) {
                              return 'Must be after "From" date'
                            }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={TxFilterFormFieldNames.AMOUNT}
                          control={control}
                          rules={{
                            validate: (val: TxFilterFormState[TxFilterFormFieldNames.AMOUNT]) => {
                              if (val?.length > 0) {
                                return validateAmount(val)
                              }
                            },
                          }}
                          render={({ field, fieldState }) => (
                            <NumberField
                              data-testid="amount-input"
                              className={inputCss.input}
                              label={
                                fieldState.error?.message ||
                                (isIncomingFilter ? 'Amount' : `Amount (only ${chain?.nativeCurrency.symbol || 'ETH'})`)
                              }
                              error={!!fieldState.error}
                              {...field}
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  {isIncomingFilter && (
                    <Grid item xs={12} md={6}>
                      <AddressInput
                        data-testid="token-input"
                        label="Token address"
                        name={TxFilterFormFieldNames.TOKEN_ADDRESS}
                        required={false}
                        fullWidth
                      />
                    </Grid>
                  )}

                  {isMultisigFilter && (
                    <>
                      <Grid item xs={12} md={6}>
                        <AddressBookInput
                          label="Recipient"
                          name={TxFilterFormFieldNames.RECIPIENT}
                          required={false}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Controller
                          name={TxFilterFormFieldNames.NONCE}
                          control={control}
                          rules={{
                            validate: (val: TxFilterFormState[TxFilterFormFieldNames.NONCE]) => {
                              if (val?.length > 0) {
                                return validateAmount(val)
                              }
                            },
                          }}
                          render={({ field, fieldState }) => (
                            <NumberField
                              data-testid="nonce-input"
                              className={inputCss.input}
                              label={fieldState.error?.message || 'Nonce'}
                              error={!!fieldState.error}
                              {...field}
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  {isModuleFilter && (
                    <Grid item xs={12} md={6}>
                      <AddressBookInput
                        label="Module"
                        name={TxFilterFormFieldNames.MODULE}
                        required={false}
                        fullWidth
                      />
                    </Grid>
                  )}
                </Grid>
              </FormControl>

              <Grid item container md={6} sx={{ gap: 2, mt: 3 }}>
                <Button data-testid="clear-btn" variant="contained" onClick={clearFilter} disabled={!canClear}>
                  Clear
                </Button>
                <Button data-testid="apply-btn" type="submit" variant="contained" color="primary" disabled={!isValid}>
                  Apply
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </form>
      </FormProvider>
    </Paper>
  )
}

export default TxFilterForm
