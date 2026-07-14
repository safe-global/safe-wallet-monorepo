import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
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

const TxFilterForm = ({ onClose }: { onClose: () => void }): ReactElement => {
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
      [TxFilterFormFieldNames.FILTER_TYPE]: getValues(TxFilterFormFieldNames.FILTER_TYPE),
    })
  }

  const onSubmit = (data: TxFilterFormState) => {
    for (const name of dirtyFieldNames) {
      trackEvent({ ...TX_LIST_EVENTS.FILTER, label: name })
    }

    const filterData = txFilter.parseFormData(data)

    setFilter(filterData)

    onClose()
  }

  return (
    <div className={css.filterWrapper}>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div data-testid="filter-modal" className="flex min-w-0 flex-col md:min-h-[320px] md:flex-row">
            <div className="w-full shrink-0 p-6 md:w-[220px] md:p-8">
              <div className="flex w-full flex-col">
                <Label className={css.filterSectionTitle}>Transaction type</Label>
                <Controller
                  name={TxFilterFormFieldNames.FILTER_TYPE}
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      className="gap-4"
                    >
                      {Object.values(TxFilterType).map((value) => (
                        <div key={value} className={css.radioOption}>
                          <RadioGroupItem value={value} id={`filter-type-${value}`} />
                          <Label htmlFor={`filter-type-${value}`} className="font-normal">
                            {value}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block md:self-stretch" />

            <div className="w-full min-w-0 flex-1 p-6 md:p-8">
              <div className="flex w-full flex-col">
                <Label className={css.filterSectionTitle}>Parameters</Label>
                <div className="flex flex-col gap-4">
                  {!isModuleFilter && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className={css.paramField} data-testid="start-date">
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
                      </div>
                      <div className={css.paramField} data-testid="end-date">
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
                      </div>
                    </div>
                  )}

                  {!isModuleFilter && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className={css.paramField}>
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
                              inputSize="xl"
                              variant="surface"
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
                      </div>

                      {isIncomingFilter && (
                        <div className={css.paramField}>
                          <AddressInput
                            data-testid="token-input"
                            label="Token address"
                            name={TxFilterFormFieldNames.TOKEN_ADDRESS}
                            required={false}
                            fullWidth
                          />
                        </div>
                      )}

                      {isMultisigFilter && (
                        <div className={css.paramField}>
                          <AddressBookInput
                            label="Recipient"
                            name={TxFilterFormFieldNames.RECIPIENT}
                            required={false}
                            fullWidth
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {isMultisigFilter && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className={css.paramField}>
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
                              inputSize="xl"
                              variant="surface"
                              label={fieldState.error?.message || 'Nonce'}
                              error={!!fieldState.error}
                              {...field}
                              fullWidth
                            />
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {isModuleFilter && (
                    <div className={css.paramField}>
                      <AddressBookInput
                        label="Module"
                        name={TxFilterFormFieldNames.MODULE}
                        required={false}
                        fullWidth
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  data-testid="clear-btn"
                  type="button"
                  variant="ghost"
                  onClick={clearFilter}
                  disabled={!canClear}
                >
                  Clear
                </Button>
                <Button data-testid="apply-btn" type="submit" disabled={!isValid}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

export default TxFilterForm
