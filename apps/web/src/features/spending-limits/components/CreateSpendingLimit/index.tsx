import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Label } from '@safe-global/views/components/ui/label'
import { Input } from '@safe-global/views/components/ui/input'
import { Field, FieldDescription, FieldLabel } from '@safe-global/views/components/ui/field'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useTokenLookup from '@/hooks/useTokenLookup'
import {
  TOKEN_LOOKUP_ERROR_TEXT,
  TOKEN_NOT_FOUND_TEXT,
  UNTRUSTED_TOKEN_WARNING,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/TokenSelector/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@safe-global/views/components/ui/select'

import AddressBookInput from '@/components/common/AddressBookInput'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import useChainId from '@/hooks/useChainId'
import { getResetTimeOptions } from '../../constants'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import TxCard, { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import { validateAmount, validateDecimalLength } from '@safe-global/utils/utils/validation'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SpendingLimitFields, type NewSpendingLimitFlowProps } from '../../types'
import useIsSpendingLimitSupported from '../../hooks/useIsSpendingLimitSupported'
import SpendingLimitNotSupported from './SpendingLimitNotSupported'
import { validateSpendingLimitAmount } from '../../services/spendingLimitValidation'

const CreateSpendingLimit = () => {
  const chainId = useChainId()
  const isSupported = useIsSpendingLimitSupported()
  const { balances } = useVisibleBalances()
  const { onNext, data } = useContext<TxFlowContextType<NewSpendingLimitFlowProps>>(TxFlowContext)

  const [tokenQuery, setTokenQuery] = useState('')
  const heldToken = balances.items.find((item) => sameAddress(item.tokenInfo.address, tokenQuery.trim()))
  const lookup = useTokenLookup(heldToken ? undefined : tokenQuery)
  // A token the Safe does not hold joins the list with a zero balance and no fiat price.
  const tokenItems = useMemo(
    () =>
      lookup.token
        ? [...balances.items, { balance: '0', fiatBalance: '0', fiatConversion: '0', tokenInfo: lookup.token }]
        : balances.items,
    [balances.items, lookup.token],
  )
  const pastedAddress = heldToken?.tokenInfo.address ?? lookup.token?.address

  const resetTimeOptions = useMemo(() => getResetTimeOptions(chainId), [chainId])

  const formMethods = useForm<NewSpendingLimitFlowProps>({
    defaultValues: data,
    mode: 'onChange',
  })

  const { handleSubmit, watch, control, formState, getValues, trigger, setValue } = formMethods

  const tokenAddress = watch(SpendingLimitFields.tokenAddress)
  const beneficiary = watch(SpendingLimitFields.beneficiary)

  // Copilot address-poisoning check for the beneficiary
  useSafeShieldForAddressPoisoning([beneficiary])
  const selectedToken = tokenAddress ? tokenItems.find((item) => item.tokenInfo.address === tokenAddress) : undefined

  useEffect(() => {
    if (pastedAddress) setValue(SpendingLimitFields.tokenAddress, pastedAddress, { shouldValidate: true })
  }, [pastedAddress, setValue])

  const lookupStatus = lookup.isLoading
    ? 'Looking up token…'
    : lookup.isError
      ? TOKEN_LOOKUP_ERROR_TEXT
      : lookup.address && !lookup.token
        ? TOKEN_NOT_FOUND_TEXT
        : lookup.token && !lookup.token.trusted
          ? UNTRUSTED_TOKEN_WARNING
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
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onNext)}>
          <div className="mb-6 w-full">
            <AddressBookInput
              data-testid="beneficiary-section"
              name={SpendingLimitFields.beneficiary}
              label="Beneficiary"
            />
          </div>

          <TokenAmountInput balances={tokenItems} selectedToken={selectedToken} validate={validateSpendingLimit} />

          <Field className="mt-4">
            <FieldLabel htmlFor="token-address-input">Token not listed? Paste its address</FieldLabel>
            <Input
              id="token-address-input"
              data-testid="token-address-input"
              placeholder="0x…"
              autoComplete="off"
              spellCheck={false}
              value={tokenQuery}
              onChange={(event) => setTokenQuery(event.target.value)}
            />
            {lookupStatus && <FieldDescription data-testid="token-lookup-status">{lookupStatus}</FieldDescription>}
          </Field>

          <Typography variant="h4" className="mt-6 font-bold">
            Reset Timer
          </Typography>
          <Typography>
            Set a reset time so the allowance automatically refills after the defined time period.
          </Typography>
          <div className="mt-2 flex items-center justify-start gap-2">
            <Label>Time Period</Label>
            <Controller
              rules={{ required: true }}
              control={control}
              name={SpendingLimitFields.resetTime}
              render={({ field }) => (
                <Select items={resetTimeOptions} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="time-period-section" className="font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resetTimeOptions.map((resetTime) => (
                      <SelectItem data-testid="time-period-item" key={resetTime.value} value={resetTime.value}>
                        {resetTime.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <TxCardActions>
            <Button data-testid="next-btn" type="submit" disabled={!formState.isValid}>
              Next
            </Button>
          </TxCardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default CreateSpendingLimit
