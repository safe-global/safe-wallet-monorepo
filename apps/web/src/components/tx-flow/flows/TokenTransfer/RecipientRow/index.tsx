import AddressBookInput from '@/components/common/AddressBookInput'
import TokenAmountInput, { TokenAmountFields } from '@/components/common/TokenAmountInput'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import DeleteIcon from '@/public/images/common/delete.svg'
import { Box, Button, FormControl, Stack, SvgIcon } from '@mui/material'
import { useFormContext } from 'react-hook-form'
import type { MultiTokenTransferParams } from '..'
import { MultiTokenTransferFields, TokenTransferType } from '..'
import { useTokenAmount } from '../utils'
import { useHasPermission } from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { useContext, useEffect, useMemo } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import SpendingLimitRow from '../SpendingLimitRow'
import { useSelector } from 'react-redux'
import { selectSpendingLimits } from '@/store/spendingLimitsSlice'

export const RecipientRow = ({
  index,
  groupName,
  removable = true,
  remove,
  disableSpendingLimit,
}: {
  index: number
  removable?: boolean
  groupName: string
  remove?: (index: number) => void
  disableSpendingLimit: boolean
}) => {
  const { balances } = useVisibleBalances()
  const spendingLimits = useSelector(selectSpendingLimits)

  const fieldName = `${groupName}.${index}`
  const {
    watch,
    formState: { errors },
    trigger,
  } = useFormContext<MultiTokenTransferParams>()

  const { setNonceNeeded } = useContext(SafeTxContext)

  const recipients = watch(MultiTokenTransferFields.recipients)
  const type = watch(MultiTokenTransferFields.type)

  const recipient = recipients?.[index]?.recipient
  const tokenAddress = recipients?.[index]?.tokenAddress

  const selectedToken = balances.items.find((item) => item.tokenInfo.address === tokenAddress)

  const { totalAmount, spendingLimitAmount } = useTokenAmount(selectedToken)

  const isAddressValid = !!recipient && !errors[MultiTokenTransferFields.recipients]?.[index]?.recipient

  const canCreateSpendingLimitTxWithToken = useHasPermission(Permission.CreateSpendingLimitTransaction, {
    token: selectedToken?.tokenInfo,
  })

  const isSpendingLimitType = type === TokenTransferType.spendingLimit

  const spendingLimitBalances = useMemo(
    () => balances.items.filter(({ tokenInfo }) => spendingLimits.find((sl) => sl.token.address === tokenInfo.address)),
    [balances.items, spendingLimits],
  )

  const maxAmount = isSpendingLimitType && totalAmount > spendingLimitAmount ? spendingLimitAmount : totalAmount

  const triggerAmountValidation = () => {
    trigger(
      recipients.map((_, i) => `${MultiTokenTransferFields.recipients}.${i}.${TokenAmountFields.amount}` as const),
    )
  }

  useEffect(() => {
    setNonceNeeded(!isSpendingLimitType || spendingLimitAmount === 0n)
  }, [setNonceNeeded, isSpendingLimitType, spendingLimitAmount])

  return (
    <>
      <Stack spacing={1}>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <AddressBookInput name={`${fieldName}.recipient`} canAdd={isAddressValid} />
          </FormControl>

          <FormControl fullWidth>
            <TokenAmountInput
              groupName={fieldName}
              balances={isSpendingLimitType ? spendingLimitBalances : balances.items}
              selectedToken={selectedToken}
              maxAmount={maxAmount}
              onChangeAmount={triggerAmountValidation}
            />
          </FormControl>

          {!disableSpendingLimit && canCreateSpendingLimitTxWithToken && (
            <FormControl fullWidth>
              <SpendingLimitRow availableAmount={spendingLimitAmount} selectedToken={selectedToken?.tokenInfo} />
            </FormControl>
          )}
        </Stack>

        {removable && (
          <Box>
            <Button
              data-testid="remove-recipient-btn"
              onClick={() => remove?.(index)}
              aria-label="Remove recipient"
              variant="text"
              startIcon={<SvgIcon component={DeleteIcon} inheritViewBox fontSize="small" />}
              size="compact"
            >
              Remove Recipient
            </Button>
          </Box>
        )}
      </Stack>
    </>
  )
}

export default RecipientRow
