import NumberField from '@/components/common/NumberField'
import { AutocompleteItem } from '@/components/tx-flow/flows/TokenTransfer/CreateTokenTransfer'
import { safeFormatUnits, safeParseUnits } from '@safe-global/utils/utils/formatters'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { validateDecimalLength, validateLimitedAmount } from '@safe-global/utils/utils/validation'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { get, useFormContext } from 'react-hook-form'
import type { FieldArrayPath, FieldValues } from 'react-hook-form'
import {
  MultiTokenTransferFields,
  type MultiTokenTransferParams,
  TokenAmountFields,
} from '@/components/tx-flow/flows/TokenTransfer/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import FiatValue from '@/components/common/FiatValue'
import { computeFiatValue } from '@/utils/fiat'
import { TokenAmountInputView } from '@views/components/common/TokenAmountInput/TokenAmountInputView'

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

  // Hold the label error back while typing (e.g. "0." is briefly invalid), but drop it at once.
  // Debounce the message, not the object: RHF swaps the error object on every re-validation, and a
  // corrected-then-broken field must not flash a previous, different message before it settles.
  const amountError = get(errors, amountField)
  const amountErrorMessage = amountError?.message?.toString()
  const debouncedAmountErrorMessage = useDebounce(amountErrorMessage, 500)
  const shownAmountError = amountError && debouncedAmountErrorMessage === amountErrorMessage ? amountError : undefined
  const isAmountError = !!shownAmountError

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

  const handleTokenChange = (value: string | null) => setValue(tokenAddressField, value, { shouldValidate: true })

  // The amount survives a token change; its validators close over the new token's decimals and
  // balance only after this render, so re-run them here rather than in the change handler.
  const previousTokenAddress = useRef(tokenAddress)
  useEffect(() => {
    if (sameAddress(previousTokenAddress.current, tokenAddress)) return
    previousTokenAddress.current = tokenAddress

    if (!watchedAmount) return
    trigger(amountField)
    if (deps) trigger(deps)
  }, [tokenAddress, watchedAmount, amountField, deps, trigger])

  const selectedBalance = balances.find((item) => item.tokenInfo.address === tokenAddress)

  return (
    <TokenAmountInputView
      amountErrorMessage={shownAmountError?.message?.toString()}
      isAmountError={isAmountError}
      showMax={maxAmount !== undefined}
      onMaxClick={onMaxAmountClick}
      tokenAddressField={tokenAddressField}
      tokenAddress={tokenAddress}
      onTokenChange={handleTokenChange}
      selectedToken={
        selectedBalance ? (
          <AutocompleteItem tokenInfo={selectedBalance.tokenInfo} balance={selectedBalance.balance} />
        ) : undefined
      }
      tokens={balances.map((item) => ({ address: item.tokenInfo.address, item: <AutocompleteItem {...item} /> }))}
      renderAmountField={(props) => (
        <NumberField
          {...props}
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
      )}
      fiatValue={fiatValue != null ? <FiatValue value={fiatValue} precise /> : undefined}
    />
  )
}

export default TokenAmountInput
