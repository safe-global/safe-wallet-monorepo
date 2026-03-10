import AddressBookInput from '@/components/common/AddressBookInput'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import DeleteIcon from '@/public/images/common/delete.svg'
import { Box, Button, FormControl, Stack, SvgIcon } from '@mui/material'
import { get, useFormContext } from 'react-hook-form'
import type { FieldArrayPath, FieldPath } from 'react-hook-form'
import type { MultiTokenTransferParams, TokenTransferParams } from '../types'
import { MultiTokenTransferFields, TokenTransferFields, TokenTransferType } from '../types'
import { useTokenAmount } from '../utils'
import { useHasPermission } from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { useCallback, useContext, useEffect, useMemo } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { selectSpendingLimits } from '@/features/spending-limits'
import { useAppSelector } from '@/store'
import { useVisibleTokens } from '../utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics'
import SpendingLimitRow from '../SpendingLimitRow'

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

const RecipientRow = ({ fieldArray, removable = true, remove, disableSpendingLimit }: RecipientRowProps) => {
  const balancesItems = useVisibleTokens()
  const spendingLimits = useAppSelector(selectSpendingLimits)

  const {
    formState: { errors },
    trigger,
    watch,
  } = useFormContext<MultiTokenTransferParams>()

  const { setNonceNeeded } = useContext(SafeTxContext)

  const recipientFieldName = getFieldName(TokenTransferFields.recipient, fieldArray)

  const type = watch(MultiTokenTransferFields.type)
  const recipient = watch(recipientFieldName)
  const tokenAddress = watch(getFieldName(TokenTransferFields.tokenAddress, fieldArray))

  const selectedToken = balancesItems.find((item) => sameAddress(item.tokenInfo.address, tokenAddress))

  const { totalAmount, spendingLimitAmount } = useTokenAmount(selectedToken)

  const isAddressValid = !!recipient && !get(errors, recipientFieldName)

  const canCreateSpendingLimitTxWithToken = useHasPermission(Permission.CreateSpendingLimitTransaction, {
    tokenAddress,
  })

  const isSpendingLimitType = type === TokenTransferType.spendingLimit

  const spendingLimitBalances = useMemo(
    () =>
      balancesItems.filter(({ tokenInfo }) =>
        spendingLimits.find((limit) => sameAddress(limit.token.address, tokenInfo.address)),
      ),
    [balancesItems, spendingLimits],
  )

  const maxAmount = isSpendingLimitType && totalAmount > spendingLimitAmount ? spendingLimitAmount : totalAmount

  const onRemove = useCallback(() => {
    remove?.(fieldArray.index)
    trigger(MultiTokenTransferFields.recipients)
  }, [remove, fieldArray.index, trigger])

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
              balances={isSpendingLimitType ? spendingLimitBalances : balancesItems}
              selectedToken={selectedToken}
              maxAmount={maxAmount}
              deps={[MultiTokenTransferFields.recipients]}
              defaultTokenAddress={tokenAddress}
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
                size="medium"
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
