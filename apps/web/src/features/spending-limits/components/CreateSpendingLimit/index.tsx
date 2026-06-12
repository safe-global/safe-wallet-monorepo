import { useCallback, useContext, useMemo } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { parseUnits, AbiCoder } from 'ethers'

import AddressBookInput from '@/components/common/AddressBookInput'
import useChainId from '@/hooks/useChainId'
import { getResetTimeOptions } from '../../constants'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import TxCard from '@/components/tx-flow/common/TxCard'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import { validateAmount, validateDecimalLength } from '@safe-global/utils/utils/validation'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SpendingLimitFields, type NewSpendingLimitFlowProps } from '../../types'

export const _validateSpendingLimit = (val: string, decimals?: number | null) => {
  // Allowance amount is uint96 https://github.com/safe-global/safe-modules/blob/main/modules/allowances/contracts/AllowanceModule.sol#L52
  try {
    const amount = parseUnits(val, decimals ?? 'Gwei')
    AbiCoder.defaultAbiCoder().encode(['int96'], [amount])
  } catch (e) {
    return Number(val) > 1 ? 'Amount is too big' : 'Amount is too small'
  }
}

const CreateSpendingLimit = () => {
  const chainId = useChainId()
  const { balances } = useVisibleBalances()
  const { onNext, data } = useContext<TxFlowContextType<NewSpendingLimitFlowProps>>(TxFlowContext)

  const resetTimeOptions = useMemo(() => getResetTimeOptions(chainId), [chainId])

  const formMethods = useForm<NewSpendingLimitFlowProps>({
    defaultValues: data,
    mode: 'onChange',
  })

  const { handleSubmit, watch, control } = formMethods

  const tokenAddress = watch(SpendingLimitFields.tokenAddress)
  const selectedToken = tokenAddress
    ? balances.items.find((item) => item.tokenInfo.address === tokenAddress)
    : undefined

  const validateSpendingLimit = useCallback(
    (value: string) => {
      return (
        validateAmount(value) ||
        validateDecimalLength(value, selectedToken?.tokenInfo.decimals) ||
        _validateSpendingLimit(value, selectedToken?.tokenInfo.decimals)
      )
    },
    [selectedToken?.tokenInfo.decimals],
  )

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

          <TokenAmountInput balances={balances.items} selectedToken={selectedToken} validate={validateSpendingLimit} />

          <Typography variant="h4" className="mt-6 font-bold">
            Reset Timer
          </Typography>
          <Typography>
            Set a reset time so the allowance automatically refills after the defined time period.
          </Typography>
          <div className="mt-2 flex w-full items-center justify-between gap-2">
            <Label>Time Period</Label>
            <Controller
              rules={{ required: true }}
              control={control}
              name={SpendingLimitFields.resetTime}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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

          <div className="flex p-2">
            <Button data-testid="next-btn" type="submit">
              Next
            </Button>
          </div>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default CreateSpendingLimit
