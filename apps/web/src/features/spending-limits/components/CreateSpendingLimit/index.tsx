import { useCallback, useContext, useEffect, useMemo } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'

import AddressBookInput from '@/components/common/AddressBookInput'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import useChainId from '@/hooks/useChainId'
import { getResetTimeOptions } from '../../constants'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import { validateAmount, validateDecimalLength } from '@safe-global/utils/utils/validation'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SpendingLimitFields, type NewSpendingLimitFlowProps } from '../../types'
import useIsSpendingLimitSupported from '../../hooks/useIsSpendingLimitSupported'
import SpendingLimitNotSupported from './SpendingLimitNotSupported'
import { validateSpendingLimitAmount } from '../../services/spendingLimitValidation'
import { CreateSpendingLimitView } from '@views/features/spending-limits/components/CreateSpendingLimit/CreateSpendingLimitView'

const CreateSpendingLimit = () => {
  const chainId = useChainId()
  const isSupported = useIsSpendingLimitSupported()
  const { balances } = useVisibleBalances()
  const { onNext, data } = useContext<TxFlowContextType<NewSpendingLimitFlowProps>>(TxFlowContext)

  const resetTimeOptions = useMemo(() => getResetTimeOptions(chainId), [chainId])

  const formMethods = useForm<NewSpendingLimitFlowProps>({
    defaultValues: data,
    mode: 'onChange',
  })

  const { handleSubmit, watch, control, formState, getValues, trigger } = formMethods

  const tokenAddress = watch(SpendingLimitFields.tokenAddress)
  const beneficiary = watch(SpendingLimitFields.beneficiary)

  // Copilot address-poisoning check for the beneficiary
  useSafeShieldForAddressPoisoning([beneficiary])
  const selectedToken = tokenAddress
    ? balances.items.find((item) => item.tokenInfo.address === tokenAddress)
    : undefined

  const tokenDecimals = selectedToken?.tokenInfo.decimals

  const validateSpendingLimit = useCallback(
    (value: string) =>
      validateAmount(value) ||
      validateDecimalLength(value, tokenDecimals) ||
      validateSpendingLimitAmount(value, tokenDecimals),
    [tokenDecimals],
  )

  // react-hook-form only evaluates `isValid` on mount, so a prefilled amount must be re-checked
  // once the selected token (and therefore its decimals) becomes known or is lost.
  useEffect(() => {
    if (getValues(SpendingLimitFields.amount)) {
      trigger(SpendingLimitFields.amount)
    }
  }, [tokenDecimals, getValues, trigger])

  if (!isSupported) {
    return <SpendingLimitNotSupported />
  }

  return (
    <FormProvider {...formMethods}>
      <CreateSpendingLimitView
        onSubmit={handleSubmit(onNext)}
        renderBeneficiaryInput={(label) => (
          <AddressBookInput data-testid="beneficiary-section" name={SpendingLimitFields.beneficiary} label={label} />
        )}
        tokenAmountInput={
          <TokenAmountInput balances={balances.items} selectedToken={selectedToken} validate={validateSpendingLimit} />
        }
        resetTimeOptions={resetTimeOptions}
        renderResetTimeController={(renderSelect) => (
          <Controller
            rules={{ required: true }}
            control={control}
            name={SpendingLimitFields.resetTime}
            render={({ field }) => renderSelect(field)}
          />
        )}
        isValid={formState.isValid}
      />
    </FormProvider>
  )
}

export default CreateSpendingLimit
