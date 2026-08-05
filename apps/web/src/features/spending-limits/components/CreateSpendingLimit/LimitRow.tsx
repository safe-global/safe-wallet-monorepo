import { useCallback, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { FormControl, IconButton, InputLabel, MenuItem, Select, Stack, SvgIcon } from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'

import DeleteIcon from '@/public/images/common/delete.svg'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { validateAmount, validateDecimalLength } from '@safe-global/utils/utils/validation'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useChainId from '@/hooks/useChainId'
import css from '@/components/tx/ExecuteCheckbox/styles.module.css'

import { getResetTimeOptions } from '../../constants'
import { SpendingLimitFields, type NewSpendingLimitFlowProps } from '../../types'
import { _validateSpendingLimit } from './validation'

const LimitRow = ({
  index,
  balances,
  removable,
  onRemove,
  amountFieldNames,
}: {
  index: number
  balances: Balances['items']
  removable: boolean
  onRemove: (index: number) => void
  amountFieldNames: string[]
}) => {
  const chainId = useChainId()
  const { control, getValues, watch } = useFormContext<NewSpendingLimitFlowProps>()

  const resetTimeOptions = useMemo(() => getResetTimeOptions(chainId), [chainId])

  const tokenAddress = watch(`${SpendingLimitFields.limits}.${index}.${SpendingLimitFields.tokenAddress}`)
  const selectedToken = tokenAddress
    ? balances.find((item) => sameAddress(item.tokenInfo.address, tokenAddress))
    : undefined
  const decimals = selectedToken?.tokenInfo.decimals

  const validateLimit = useCallback(
    (value: string) => {
      const amountError =
        validateAmount(value) || validateDecimalLength(value, decimals) || _validateSpendingLimit(value, decimals)

      if (amountError) return amountError

      // Two setAllowance calls for the same token in one MultiSend would silently overwrite each other
      const rows = getValues(SpendingLimitFields.limits) ?? []
      const isDuplicate = rows.some(
        (row, rowIndex) => rowIndex !== index && sameAddress(row.tokenAddress, rows[index]?.tokenAddress),
      )

      return isDuplicate ? 'This token already has a limit in this transaction' : undefined
    },
    [decimals, getValues, index],
  )

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        <Stack flex={1}>
          <TokenAmountInput
            balances={balances}
            selectedToken={selectedToken}
            validate={validateLimit}
            fieldArray={{ name: SpendingLimitFields.limits, index }}
            deps={amountFieldNames}
          />
        </Stack>

        {removable && (
          <IconButton
            data-testid="remove-limit-btn"
            onClick={() => onRemove(index)}
            aria-label="Remove limit"
            size="small"
          >
            <SvgIcon component={DeleteIcon} inheritViewBox fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <FormControl fullWidth className={css.select}>
        <InputLabel shrink={false}>Time Period</InputLabel>
        <Controller
          rules={{ required: true }}
          control={control}
          name={`${SpendingLimitFields.limits}.${index}.${SpendingLimitFields.resetTime}`}
          render={({ field }) => (
            <Select
              data-testid="time-period-section"
              {...field}
              sx={{ textAlign: 'right', fontWeight: 700 }}
              IconComponent={ExpandMoreRoundedIcon}
            >
              {resetTimeOptions.map((resetTime) => (
                <MenuItem
                  data-testid="time-period-item"
                  key={resetTime.value}
                  value={resetTime.value}
                  sx={{ overflow: 'hidden' }}
                >
                  {resetTime.label}
                </MenuItem>
              ))}
            </Select>
          )}
        />
      </FormControl>
    </Stack>
  )
}

export default LimitRow
