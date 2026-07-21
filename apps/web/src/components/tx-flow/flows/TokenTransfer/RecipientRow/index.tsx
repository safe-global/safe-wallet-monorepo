import AddressBookInput from '@/components/common/AddressBookInput'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import DeleteIcon from '@/public/images/common/delete.svg'
import { Button } from '@/components/ui/button'
import { get, useFormContext } from 'react-hook-form'
import type { FieldArrayPath, FieldPath } from 'react-hook-form'
import type { MultiTokenTransferParams, TokenTransferParams } from '../types'
import { MultiTokenTransferFields, TokenTransferFields, TokenTransferType } from '../types'
import { useTokenAmount } from '../utils'
import { useHasPermission } from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { selectSpendingLimits } from '@/features/spending-limits'
import { useAppSelector } from '@/store'
import { useVisibleTokens } from '../utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics'
import SpendingLimitRow from '../SpendingLimitRow'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X } from 'lucide-react'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useResolvedGasToken, type FeePreviewTx } from '@/features/gtf'
import { createTokenTransferParams } from '@/services/tx/tokenTransferParams'
import { OperationType } from '@safe-global/types-kit'

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

  const isGtfEnabled = useHasFeature(FEATURES.GTF)
  const [maxPressed, setMaxPressed] = useState(false)

  // Probe only after Max click — eager probing on every edit wastes network for the common case.
  const previewTx = useMemo<FeePreviewTx | undefined>(() => {
    if (!isGtfEnabled || !maxPressed || !isAddressValid || !selectedToken) return undefined
    const params = createTokenTransferParams(recipient, '1', selectedToken.tokenInfo.decimals, tokenAddress)
    return { ...params, operation: OperationType.Call }
  }, [isGtfEnabled, maxPressed, isAddressValid, recipient, selectedToken, tokenAddress])

  const resolution = useResolvedGasToken(isGtfEnabled ? tokenAddress : undefined, previewTx)
  const sentTokenIsFeeToken = resolution.status === 'resolved' && sameAddress(tokenAddress, resolution.address)

  // Reset banner when token changes
  useEffect(() => {
    setMaxPressed(false)
  }, [tokenAddress])

  const showFeeBanner = !!isGtfEnabled && !isSpendingLimitType && maxPressed && sentTokenIsFeeToken

  const onRemove = useCallback(() => {
    remove?.(fieldArray.index)
    trigger(MultiTokenTransferFields.recipients)
  }, [remove, fieldArray.index, trigger])

  useEffect(() => {
    setNonceNeeded(!isSpendingLimitType || spendingLimitAmount === 0n)
  }, [setNonceNeeded, isSpendingLimitType, spendingLimitAmount])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-4">
        <div className="w-full">
          <AddressBookInput name={recipientFieldName} canAdd={isAddressValid} />
        </div>

        <div className="w-full">
          <TokenAmountInput
            fieldArray={fieldArray}
            balances={isSpendingLimitType ? spendingLimitBalances : balancesItems}
            selectedToken={selectedToken}
            maxAmount={maxAmount}
            deps={[MultiTokenTransferFields.recipients]}
            defaultTokenAddress={tokenAddress}
            onMaxClick={() => setMaxPressed(true)}
          />
        </div>

        {showFeeBanner && (
          <Alert data-testid="gtf-fee-banner" className="items-center">
            <AlertDescription className="flex w-full items-center justify-between gap-2">
              <span>
                Your max send amount accounts for fees paid in {selectedToken?.tokenInfo.symbol}. This updates if fees
                change.
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Dismiss fee banner"
                onClick={() => setMaxPressed(false)}
              >
                <X className="size-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!disableSpendingLimit && canCreateSpendingLimitTxWithToken && (
          <div className="w-full">
            <SpendingLimitRow availableAmount={spendingLimitAmount} selectedToken={selectedToken?.tokenInfo} />
          </div>
        )}
      </div>

      {removable && (
        <div>
          <Track {...MODALS_EVENTS.REMOVE_RECIPIENT}>
            <Button
              data-testid="remove-recipient-btn"
              onClick={onRemove}
              aria-label="Remove recipient"
              variant="destructive"
            >
              <DeleteIcon className="size-4" />
              Remove recipient
            </Button>
          </Track>
        </div>
      )}
    </div>
  )
}

export default RecipientRow
