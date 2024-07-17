import { formatVisualAmount, safeFormatUnits } from '@/utils/formatters'
import { Box, Button, Divider, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import { type SafeBalanceResponse } from '@safe-global/safe-gateway-typescript-sdk'
import css from './styles.module.css'
import NumberField from '@/components/common/NumberField'
import { validateDecimalLength, validateLimitedAmount } from '@/utils/validation'
import { AutocompleteItem } from '@/components/tx-flow/flows/TokenTransfer/CreateTokenTransfer'
import { useFormContext } from 'react-hook-form'
import classNames from 'classnames'
import { useCallback, useMemo } from 'react'

export enum TokenAmountFields {
  tokenAddress = 'tokenAddress',
  amount = 'amount',
}

const TokenAmountInput = ({
  balances,
  selectedToken,
  maxAmount,
  validate,
}: {
  balances: SafeBalanceResponse['items']
  selectedToken: SafeBalanceResponse['items'][number] | undefined
  maxAmount?: bigint
  validate?: (value: string) => string | undefined,
}) => {
  const {
    formState: { errors },
    register,
    resetField,
    watch,
    setValue,
  } = useFormContext<{ [TokenAmountFields.tokenAddress]: string;[TokenAmountFields.amount]: string }>()

  const tokenAddress = watch(TokenAmountFields.tokenAddress)
  const isAmountError = !!errors[TokenAmountFields.tokenAddress] || !!errors[TokenAmountFields.amount]

  const validateAmount = useCallback(
    (value: string) => {
      const decimals = selectedToken?.tokenInfo.decimals
      return validateLimitedAmount(value, decimals, maxAmount?.toString()) || validateDecimalLength(value, decimals)
    },
    [maxAmount, selectedToken?.tokenInfo.decimals],
  )

  const onMaxAmountClick = useCallback(() => {
    if (!selectedToken || maxAmount === undefined) return

    setValue(TokenAmountFields.amount, safeFormatUnits(maxAmount.toString(), selectedToken.tokenInfo.decimals), {
      shouldValidate: true,
    })
  }, [maxAmount, selectedToken, setValue])

  const currentBalance = useMemo(() => (
    balances.find(item => item.tokenInfo.address === tokenAddress)
  )
    , [balances, tokenAddress])

  return (
    <FormControl
      data-testid="token-amount-section"
      className={classNames({ [css.error]: isAmountError })}
      fullWidth
    >
      <InputLabel shrink required className={css.label}>
        {errors[TokenAmountFields.tokenAddress]?.message || errors[TokenAmountFields.amount]?.message || 'Amount'}
      </InputLabel>
      <div className={classNames(css.inputs)}>
        <NumberField
          data-testid="token-amount-field"
          InputProps={{
            disableUnderline: true,
            // endAdornment: maxAmount !== undefined && (

            // ),
          }}
          className={css.amount}
          required
          placeholder="0"
          {...register(TokenAmountFields.amount, {
            required: true,
            validate: validate ?? validateAmount,
          })}
        />
        <Select
          data-testid="token-balance"
          variant="standard"
          disableUnderline
          className={css.select}
          {...register(TokenAmountFields.tokenAddress, {
            required: true,
            onChange: () => {
              resetField(TokenAmountFields.amount, { defaultValue: '' })
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
        </Select>
      </div>
      {
        currentBalance && (
          <Box width='100%' display='flex' justifyContent='flex-end' gap={1} alignItems='center' padding={1}>
            <Typography variant="caption" component="p">
              Balcance: {formatVisualAmount(currentBalance.balance, currentBalance.tokenInfo.decimals)} {currentBalance.tokenInfo.symbol}
            </Typography>
            <Typography className={css.max} data-testid="max-btn" onClick={onMaxAmountClick}>
              Max
            </Typography>
          </Box>
        )
      }
    </FormControl>
  )
}

export default TokenAmountInput
