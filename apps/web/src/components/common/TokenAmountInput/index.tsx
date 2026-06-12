import NumberField from '@/components/common/NumberField'
import { AutocompleteItem } from '@/components/tx-flow/flows/TokenTransfer/CreateTokenTransfer'
import { safeFormatUnits, safeParseUnits } from '@safe-global/utils/utils/formatters'
import { validateDecimalLength, validateLimitedAmount } from '@safe-global/utils/utils/validation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import classNames from 'classnames'
import { useCallback, useMemo } from 'react'
import { get, useFormContext } from 'react-hook-form'
import type { FieldArrayPath, FieldValues } from 'react-hook-form'
import css from './styles.module.css'
import {
  MultiTokenTransferFields,
  type MultiTokenTransferParams,
  TokenAmountFields,
} from '@/components/tx-flow/flows/TokenTransfer/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import FiatValue from '@/components/common/FiatValue'
import { computeFiatValue } from '@/utils/fiat'

export const InsufficientFundsValidationError = 'Insufficient funds'

const getFieldName = (field: TokenAmountFields, fieldArray?: TokenAmountInputProps['fieldArray']) =>
  fieldArray ? `${fieldArray.name}.${fieldArray.index}.${field}` : field

type TokenAmountInputProps = {
  balances: Balances['items']
  selectedToken: Balances['items'][number] | undefined
  maxAmount?: bigint
  validate?: (value: string) => string | undefined
  fieldArray?: { name: FieldArrayPath<FieldValues>; index: number }
  deps?: string[]
  defaultTokenAddress?: string
  onMaxClick?: () => void
}

const TokenAmountInput = ({
  balances,
  selectedToken,
  maxAmount,
  validate,
  fieldArray,
  deps,
  defaultTokenAddress,
  onMaxClick,
}: TokenAmountInputProps) => {
  const {
    formState: { errors, defaultValues },
    register,
    resetField,
    watch,
    setValue,
    trigger,
  } = useFormContext()

  const { getValues } = useFormContext<MultiTokenTransferParams>()

  const tokenAddressField = getFieldName(TokenAmountFields.tokenAddress, fieldArray)
  const amountField = getFieldName(TokenAmountFields.amount, fieldArray)

  const watchedTokenAddress = watch(tokenAddressField)
  // Ensure we always have a defined value to keep MUI Select controlled
  // Use defaultTokenAddress as fallback when watch() returns empty on first render
  const tokenAddress = watchedTokenAddress || defaultTokenAddress || ''
  const watchedAmount = watch(amountField) || ''

  const isAmountError = !!get(errors, tokenAddressField) || !!get(errors, amountField)

  const fiatValue = useMemo(
    () => computeFiatValue(parseFloat(watchedAmount), selectedToken?.fiatConversion),
    [watchedAmount, selectedToken],
  )

  const validateAmount = useCallback(
    (value: string) => {
      const decimals = selectedToken?.tokenInfo.decimals
      const maxAmountString = maxAmount?.toString()

      const valueValidationError =
        validateLimitedAmount(value, decimals, maxAmountString) || validateDecimalLength(value, decimals)

      if (valueValidationError) {
        return valueValidationError
      }

      // Validate the total amount of the selected token in the multi transfer
      const recipients = getValues(MultiTokenTransferFields.recipients)
      const sumAmount = recipients.reduce<bigint>((acc, item) => {
        const value = safeParseUnits(item.amount || '0', decimals) || 0n
        return acc + (sameAddress(item.tokenAddress, tokenAddress) ? value : 0n)
      }, 0n)

      return validateLimitedAmount(sumAmount.toString(), 0, maxAmountString, InsufficientFundsValidationError)
    },
    [maxAmount, selectedToken?.tokenInfo.decimals, getValues, tokenAddress],
  )

  const onMaxAmountClick = useCallback(() => {
    if (!selectedToken || maxAmount === undefined) return

    setValue(amountField, safeFormatUnits(maxAmount.toString(), selectedToken.tokenInfo.decimals), {
      shouldValidate: true,
    })

    onMaxClick?.()
    trigger(deps)
  }, [maxAmount, selectedToken, setValue, amountField, trigger, deps, onMaxClick])

  const onChangeToken = useCallback(() => {
    const amountDefaultValue = get(
      defaultValues,
      getFieldName(TokenAmountFields.amount, fieldArray ? { ...fieldArray, index: 0 } : undefined),
    )

    resetField(amountField, amountDefaultValue)

    trigger(deps)
  }, [resetField, amountField, trigger, deps, defaultValues, fieldArray])

  const handleTokenChange = useCallback(
    (value: string) => {
      setValue(tokenAddressField, value, { shouldValidate: true })
      onChangeToken()
    },
    [setValue, tokenAddressField, onChangeToken],
  )

  const selectedBalance = balances.find((item) => item.tokenInfo.address === tokenAddress)

  return (
    <>
      <div
        data-testid="token-amount-section"
        className={classNames(css.outline, { [css.error]: isAmountError }, 'w-full')}
      >
        <label className={classNames(css.label, 'block text-xs font-medium')}>
          {get(errors, tokenAddressField)?.message?.toString() ||
            get(errors, amountField)?.message?.toString() ||
            'Amount'}
        </label>
        <div className={css.inputs}>
          <NumberField
            data-testid="token-amount-field"
            endAdornment={
              maxAmount !== undefined && (
                <Button variant="ghost" data-testid="max-btn" className={css.max} onClick={onMaxAmountClick}>
                  Max
                </Button>
              )
            }
            className={css.amount}
            required
            placeholder="0"
            {...register(amountField, {
              required: true,
              setValueAs: (value: string): string => {
                if (typeof value !== 'string') {
                  return value
                }

                return value.replace(/,/g, '.')
              },
              validate: validate ?? validateAmount,
              deps,
            })}
          />
          <Separator orientation="vertical" className="h-auto self-stretch" />
          <div data-testid="token-selector" className={css.select}>
            <Select name={tokenAddressField} value={tokenAddress} onValueChange={handleTokenChange} required>
              <SelectTrigger>
                <SelectValue>
                  {selectedBalance && (
                    <AutocompleteItem tokenInfo={selectedBalance.tokenInfo} balance={selectedBalance.balance} />
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {balances.map((item) => (
                  <SelectItem data-testid="token-item" key={item.tokenInfo.address} value={item.tokenInfo.address}>
                    <AutocompleteItem {...item} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {fiatValue != null && (
        <Typography
          data-testid="fiat-display"
          variant="paragraph-mini"
          className={classNames(css.fiatDisplay, 'text-muted-foreground')}
        >
          <FiatValue value={fiatValue} precise />
        </Typography>
      )}
    </>
  )
}

export default TokenAmountInput
