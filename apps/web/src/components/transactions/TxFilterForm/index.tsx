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

import AddressInput from '@/components/common/AddressInput'
import { TxFilterFormView } from '@views/components/transactions/TxFilterForm/TxFilterFormView'

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
    <FormProvider {...formMethods}>
      <TxFilterFormView
        onSubmit={handleSubmit(onSubmit)}
        filterTypes={Object.values(TxFilterType)}
        renderFilterTypeField={(render) => (
          <Controller
            name={TxFilterFormFieldNames.FILTER_TYPE}
            control={control}
            render={({ field }) => render(field)}
          />
        )}
        isIncomingFilter={isIncomingFilter}
        isMultisigFilter={isMultisigFilter}
        isModuleFilter={isModuleFilter}
        nativeCurrencySymbol={chain?.nativeCurrency.symbol}
        renderFromDate={({ label, invalidMessage }) => (
          <DatePickerInput
            name={TxFilterFormFieldNames.DATE_FROM}
            label={label}
            deps={[TxFilterFormFieldNames.DATE_TO]}
            validate={(val: TxFilterFormState[TxFilterFormFieldNames.DATE_FROM]) => {
              const toDate = getValues(TxFilterFormFieldNames.DATE_TO)
              if (val && toDate && isBefore(startOfDay(toDate), startOfDay(val))) {
                return invalidMessage
              }
            }}
          />
        )}
        renderToDate={({ label, invalidMessage }) => (
          <DatePickerInput
            name={TxFilterFormFieldNames.DATE_TO}
            label={label}
            deps={[TxFilterFormFieldNames.DATE_FROM]}
            validate={(val: TxFilterFormState[TxFilterFormFieldNames.DATE_FROM]) => {
              const fromDate = getValues(TxFilterFormFieldNames.DATE_FROM)
              if (val && fromDate && isAfter(startOfDay(fromDate), startOfDay(val))) {
                return invalidMessage
              }
            }}
          />
        )}
        renderAmountField={({ getLabel, ...props }) => (
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
                {...props}
                label={getLabel(fieldState.error?.message)}
                error={!!fieldState.error}
                {...field}
                fullWidth
              />
            )}
          />
        )}
        renderTokenInput={({ label }) => (
          <AddressInput
            data-testid="token-input"
            label={label}
            name={TxFilterFormFieldNames.TOKEN_ADDRESS}
            required={false}
            fullWidth
          />
        )}
        renderRecipientInput={({ label }) => (
          <AddressBookInput label={label} name={TxFilterFormFieldNames.RECIPIENT} required={false} fullWidth />
        )}
        renderNonceField={({ getLabel, ...props }) => (
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
                {...props}
                label={getLabel(fieldState.error?.message)}
                error={!!fieldState.error}
                {...field}
                fullWidth
              />
            )}
          />
        )}
        renderModuleInput={({ label }) => (
          <AddressBookInput label={label} name={TxFilterFormFieldNames.MODULE} required={false} fullWidth />
        )}
        canClear={canClear}
        isValid={isValid}
        onClear={clearFilter}
      />
    </FormProvider>
  )
}

export default TxFilterForm
