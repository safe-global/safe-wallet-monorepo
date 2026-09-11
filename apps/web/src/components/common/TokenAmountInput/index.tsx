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
    formState: { errors },
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

  const isAmountError = !!get(errors, amountField)

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
    // Clear, not reset: with prefilled defaultValues a reset would restore the old token's amount.
    resetField(amountField, { defaultValue: '' })

    trigger(deps)
  }, [resetField, amountField, trigger, deps])

  const handleTokenChange = useCallback(
    (value: string) => {
      // Re-picking the same token is not a change, so it must not wipe a typed amount.
      if (sameAddress(value, tokenAddress)) return

      setValue(tokenAddressField, value, { shouldValidate: true })
      onChangeToken()
    },
    [setValue, tokenAddressField, onChangeToken, tokenAddress],
  )

  const selectedBalance = balances.find((item) => item.tokenInfo.address === tokenAddress)

  return (
    <>
      <div data-testid="token-amount-section" className="w-full">
        <NumberField
          data-testid="token-amount-field"
          label={get(errors, amountField)?.message?.toString() || 'Amount'}
          error={isAmountError}
          fullWidth
          inputSize="hero"
          endAdornment={
            <div className="flex items-stretch gap-1">
              {maxAmount !== undefined && (
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="max-btn"
                  // eslint-disable-next-line no-restricted-syntax -- h-auto drops size="sm"'s h-8 so Max matches the content-sized token select beside it
                  className="h-auto uppercase"
                  onClick={onMaxAmountClick}
                >
                  Max
                </Button>
              )}
              <Separator orientation="vertical" className="mx-1" />
              <div data-testid="token-selector" className={css.select}>
                <Select name={tokenAddressField} value={tokenAddress} onValueChange={handleTokenChange} required>
                  {/* size="sm" lines the trigger up with the Max button and the h-8 divider beside it;
                      min-h still lets it grow for the rich token row. */}
                  <SelectTrigger size="sm">
                    {/* Always pass a non-null child: with no child, base-ui's SelectValue falls back to
                        rendering the raw address (e.g. in a new Safe with no funds). */}
                    <SelectValue>
                      {selectedBalance ? (
                        <AutocompleteItem tokenInfo={selectedBalance.tokenInfo} balance={selectedBalance.balance} />
                      ) : (
                        ''
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-auto min-w-44 max-w-[var(--available-width)]">
                    {balances.map((item) => (
                      <SelectItem data-testid="token-item" key={item.tokenInfo.address} value={item.tokenInfo.address}>
                        <AutocompleteItem {...item} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
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
