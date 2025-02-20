import NumberField from '@/components/common/NumberField'
import { AutocompleteItem } from '@/components/tx-flow/flows/TokenTransfer/CreateTokenTransfer'
import { safeFormatUnits } from '@/utils/formatters'
import { validateDecimalLength, validateLimitedAmount } from '@/utils/validation'
import { Button, Divider, FormControl, InputLabel, MenuItem, TextField } from '@mui/material'
import { type SafeBalanceResponse } from '@safe-global/safe-gateway-typescript-sdk'
import classNames from 'classnames'
import { useCallback } from 'react'
import { get, useFormContext } from 'react-hook-form'
import css from './styles.module.css'
import { MultiTokenTransferFields, type MultiTokenTransferParams } from '@/components/tx-flow/flows/TokenTransfer'

export enum TokenAmountFields {
  tokenAddress = 'tokenAddress',
  amount = 'amount',
}

export const InsufficientFundsValidationError = 'Insufficient funds'

const getFieldName = (field: TokenAmountFields, groupName?: string) => (groupName ? `${groupName}.${field}` : field)

const TokenAmountInput = ({
  balances,
  selectedToken,
  maxAmount,
  validate,
  groupName,
  onChangeAmount,
}: {
  balances: SafeBalanceResponse['items']
  selectedToken: SafeBalanceResponse['items'][number] | undefined
  maxAmount?: bigint
  validate?: (value: string) => string | undefined
  groupName?: string
  onChangeAmount?: (value: string) => void
}) => {
  const {
    formState: { errors },
    register,
    resetField,
    watch,
    setValue,
    getValues,
  } = useFormContext()

  const tokenAddressField = getFieldName(TokenAmountFields.tokenAddress, groupName)
  const amountField = getFieldName(TokenAmountFields.amount, groupName)

  const tokenAddress = watch(tokenAddressField)

  const isAmountError = !!get(errors, tokenAddressField) || !!get(errors, amountField)

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
      const recipients = getValues(MultiTokenTransferFields.recipients) as MultiTokenTransferParams['recipients']
      const sumAmount = recipients.reduce<number>(
        (acc, item) => acc + (item.tokenAddress === tokenAddress ? Number(item.amount) : 0),
        0,
      )

      return validateLimitedAmount(sumAmount.toString(), decimals, maxAmountString, InsufficientFundsValidationError)
    },
    [maxAmount, selectedToken?.tokenInfo.decimals, getValues, tokenAddress],
  )

  const onMaxAmountClick = useCallback(() => {
    if (!selectedToken || maxAmount === undefined) return

    setValue(amountField, safeFormatUnits(maxAmount.toString(), selectedToken.tokenInfo.decimals), {
      shouldValidate: true,
    })

    onChangeAmount?.(maxAmount.toString())
  }, [maxAmount, selectedToken, setValue, amountField, onChangeAmount])

  const onChangeToken = useCallback(() => {
    resetField(amountField, { defaultValue: '' })
    onChangeAmount?.('')
  }, [resetField, amountField, onChangeAmount])

  return (
    <FormControl
      data-testid="token-amount-section"
      className={classNames(css.outline, { [css.error]: isAmountError })}
      fullWidth
    >
      <InputLabel shrink required className={css.label}>
        {get(errors, tokenAddressField)?.message?.toString() ||
          get(errors, amountField)?.message?.toString() ||
          'Amount'}
      </InputLabel>
      <div className={css.inputs}>
        <NumberField
          data-testid="token-amount-field"
          variant="standard"
          InputProps={{
            disableUnderline: true,
            endAdornment: maxAmount !== undefined && (
              <Button data-testid="max-btn" className={css.max} onClick={onMaxAmountClick}>
                Max
              </Button>
            ),
          }}
          className={css.amount}
          required
          placeholder="0"
          {...register(amountField, {
            required: true,
            validate: validate ?? validateAmount,
            onChange: (e) => onChangeAmount?.(e.target.value),
          })}
        />
        <Divider orientation="vertical" flexItem />
        <TextField
          data-testid="token-balance"
          select
          variant="standard"
          InputProps={{
            disableUnderline: true,
          }}
          className={css.select}
          {...register(tokenAddressField, {
            required: true,
            onChange: onChangeToken,
          })}
          value={tokenAddress}
          required
        >
          {balances.map((item) => (
            <MenuItem data-testid="token-item" key={item.tokenInfo.address} value={item.tokenInfo.address}>
              <AutocompleteItem {...item} />
            </MenuItem>
          ))}
        </TextField>
      </div>
    </FormControl>
  )
}

export default TokenAmountInput
