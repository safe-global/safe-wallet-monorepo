import AddressBookInput from '@/components/common/AddressBookInput'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import DeleteIcon from '@/public/images/common/delete.svg'
import { Box, Button, FormControl, Stack, SvgIcon } from '@mui/material'
import { get, useFormContext } from 'react-hook-form'
import type { FieldArrayPath, FieldPath } from 'react-hook-form'
import type { MultiTokenTransferParams, TokenTransferParams } from '..'
import { MultiTokenTransferFields, TokenTransferFields, TokenTransferType } from '..'
import { useTokenAmount } from '../utils'
import { useHasPermission } from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { useCallback, useContext, useEffect, useMemo } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import SpendingLimitRow from '../SpendingLimitRow'
import { useSelector } from 'react-redux'
import { selectSpendingLimits } from '@/store/spendingLimitsSlice'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics'

const getFieldName = (
  field: keyof TokenTransferParams,
  { name, index }: RecipientRowProps['fieldArray'],
): FieldPath<MultiTokenTransferParams> => `${name}.${index}.${field}`

type RecipientRowProps = {
  disableSpendingLimit: boolean
  fieldArray: { name: FieldArrayPath<MultiTokenTransferParams>; index: number }
  removable?: boolean
  remove?: (index: number) => void
}

export const RecipientRow = ({ fieldArray, removable = true, remove, disableSpendingLimit }: RecipientRowProps) => {
  const { balances } = useVisibleBalances()
  const spendingLimits = useSelector(selectSpendingLimits)

  const {
    formState: { errors },
    trigger,
    watch,
  } = useFormContext<MultiTokenTransferParams>()

  const { setNonceNeeded } = useContext(SafeTxContext)

  const recipientFieldName = getFieldName(TokenTransferFields.recipient, fieldArray)

  const recipients = watch(MultiTokenTransferFields.recipients)
  const type = watch(MultiTokenTransferFields.type)
  const recipient = watch(recipientFieldName)
  const tokenAddress = watch(getFieldName(TokenTransferFields.tokenAddress, fieldArray))

  const selectedToken = balances.items.find((item) => sameAddress(item.tokenInfo.address, tokenAddress))

  const { totalAmount, spendingLimitAmount } = useTokenAmount(selectedToken)

  const isAddressValid = !!recipient && !get(errors, recipientFieldName)

  const canCreateSpendingLimitTxWithToken = useHasPermission(Permission.CreateSpendingLimitTransaction, {
    tokenAddress,
  })

  const isSpendingLimitType = type === TokenTransferType.spendingLimit

  const spendingLimitBalances = useMemo(
    () =>
      balances.items.filter(({ tokenInfo }) =>
        spendingLimits.find((sl) => sameAddress(sl.token.address, tokenInfo.address)),
      ),
    [balances.items, spendingLimits],
  )

  const maxAmount = isSpendingLimitType && totalAmount > spendingLimitAmount ? spendingLimitAmount : totalAmount

  const deps = useMemo(
    () =>
      recipients.map((_, index) =>
        getFieldName(TokenTransferFields.amount, { name: MultiTokenTransferFields.recipients, index }),
      ),
    [recipients],
  )

  const onRemove = useCallback(() => {
    remove?.(fieldArray.index)
    trigger(deps)
  }, [remove, fieldArray.index, trigger, deps])

  useEffect(() => {
    setNonceNeeded(!isSpendingLimitType || spendingLimitAmount === 0n)
  }, [setNonceNeeded, isSpendingLimitType, spendingLimitAmount])

  return (
    <>
      <Stack spacing={1}>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <AddressBookInput name={recipientFieldName} canAdd={isAddressValid} />
          </FormControl>

          <FormControl fullWidth>
            <TokenAmountInput
              fieldArray={fieldArray}
              balances={isSpendingLimitType ? spendingLimitBalances : balances.items}
              selectedToken={selectedToken}
              maxAmount={maxAmount}
              deps={deps}
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
            <Track {...MODALS_EVENTS.REMOVE_RECIPIENT}>
              <Button
                data-testid="remove-recipient-btn"
                onClick={onRemove}
                aria-label="Remove recipient"
                variant="text"
                startIcon={<SvgIcon component={DeleteIcon} inheritViewBox fontSize="small" />}
                size="compact"
              >
                Remove recipient
              </Button>
            </Track>
          </Box>
        )}
      </Stack>
    </>
  )
}

export default RecipientRow
