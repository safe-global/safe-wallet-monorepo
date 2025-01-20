import NumberField from '@/components/common/NumberField'
import { AutocompleteItem } from '@/components/tx-flow/flows/TokenTransfer/CreateTokenTransfer'
import { safeFormatUnits } from '@/utils/formatters'
import { validateDecimalLength, validateLimitedAmount } from '@/utils/validation'
import { Button, Divider, FormControl, InputLabel, MenuItem, TextField } from '@mui/material'
import { type SafeBalanceResponse } from '@safe-global/safe-gateway-typescript-sdk'
import classNames from 'classnames'
import { useCallback, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import css from './styles.module.css'

export enum TokenAmountFields {
  tokenAddress = 'tokenAddress',
  amount = 'amount',
}

const TokenAmountInput = ({
  balances,
  selectedToken,
  maxAmount,
  validate,
  groupName,
}: {
  balances: SafeBalanceResponse['items']
  selectedToken: SafeBalanceResponse['items'][number] | undefined
  maxAmount?: bigint
  validate?: (value: string) => string | undefined
  groupName?: string
}) => {
  const fields = useMemo(
    () => ({
      tokenAddress: groupName ? `${groupName}.${TokenAmountFields.tokenAddress}` : TokenAmountFields.tokenAddress,
      amount: groupName ? `${groupName}.${TokenAmountFields.amount}` : TokenAmountFields.amount,
    }),
    [groupName],
  )

  const {
    formState: { errors },
    register,
    resetField,
    watch,
    setValue,
  } = useFormContext()

  const tokenAddress = watch(fields.tokenAddress)
  const isAmountError = !!errors[fields.tokenAddress] || !!errors[fields.amount]

  const validateAmount = useCallback(
    (value: string) => {
      const decimals = selectedToken?.tokenInfo.decimals
      return validateLimitedAmount(value, decimals, maxAmount?.toString()) || validateDecimalLength(value, decimals)
    },
    [maxAmount, selectedToken?.tokenInfo.decimals],
  )

  const onMaxAmountClick = useCallback(() => {
    if (!selectedToken || maxAmount === undefined) return

    setValue(fields.amount, safeFormatUnits(maxAmount.toString(), selectedToken.tokenInfo.decimals), {
      shouldValidate: true,
    })
  }, [maxAmount, selectedToken, setValue, fields])

  return (
    <FormControl
      data-testid="token-amount-section"
      className={classNames(css.outline, { [css.error]: isAmountError })}
      fullWidth
    >
      <InputLabel shrink required className={css.label}>
        {errors[fields.tokenAddress]?.message?.toString() || errors[fields.amount]?.message?.toString() || 'Amount'}
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
          {...register(fields.amount, {
            required: true,
            validate: validate ?? validateAmount,
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
          {...register(fields.tokenAddress, {
            required: true,
            onChange: () => {
              resetField(fields.amount, { defaultValue: '' })
            },
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
