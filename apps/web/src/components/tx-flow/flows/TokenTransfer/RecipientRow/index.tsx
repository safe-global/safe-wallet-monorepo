import AddressBookInput from '@/components/common/AddressBookInput'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import DeleteIcon from '@/public/images/common/delete.svg'
import { Alert, Box, Button, FormControl, IconButton, Stack, SvgIcon } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { get, useFormContext } from 'react-hook-form'
import type { FieldArrayPath, FieldPath } from 'react-hook-form'
import type { MultiTokenTransferParams, TokenTransferParams } from '../types'
import { MultiTokenTransferFields, TokenTransferFields, TokenTransferType } from '../types'
import { useTokenAmount } from '../utils'
import { useHasPermission } from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isAddress } from 'ethers'
import {
  useAddressSimilarity,
  AddressSimilarityWarning,
  SimilarAddressConfirmDialog,
} from '@/features/address-poisoning'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { selectSpendingLimits } from '@/features/spending-limits'
import { useAppSelector } from '@/store'
import { useVisibleTokens } from '../utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics'
import SpendingLimitRow from '../SpendingLimitRow'
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

  // Address-poisoning: warn when the recipient dangerously resembles a trusted anchor.
  const candidateRecipient = useMemo(() => {
    const raw = String(recipient ?? '')
      .split(':')
      .pop()
    return raw && isAddress(raw) ? raw : undefined
  }, [recipient])
  const similarityMatch = useAddressSimilarity(candidateRecipient)
  const [isCompareOpen, setIsCompareOpen] = useState(false)

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
    <Stack spacing={1}>
      <Stack spacing={2}>
        <FormControl fullWidth>
          <AddressBookInput name={recipientFieldName} canAdd={isAddressValid} />
        </FormControl>

        {similarityMatch && (
          <AddressSimilarityWarning match={similarityMatch} onReview={() => setIsCompareOpen(true)} />
        )}

        <FormControl fullWidth>
          <TokenAmountInput
            fieldArray={fieldArray}
            balances={isSpendingLimitType ? spendingLimitBalances : balancesItems}
            selectedToken={selectedToken}
            maxAmount={maxAmount}
            deps={[MultiTokenTransferFields.recipients]}
            defaultTokenAddress={tokenAddress}
            onMaxClick={() => setMaxPressed(true)}
          />
        </FormControl>

        {showFeeBanner && (
          <Alert
            severity="info"
            data-testid="gtf-fee-banner"
            action={
              <IconButton size="small" onClick={() => setMaxPressed(false)} aria-label="Dismiss fee banner">
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            Your max send amount accounts for fees paid in {selectedToken?.tokenInfo.symbol}. This updates if fees
            change.
          </Alert>
        )}

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

      {similarityMatch && candidateRecipient && (
        <SimilarAddressConfirmDialog
          open={isCompareOpen}
          candidate={candidateRecipient}
          match={similarityMatch}
          onConfirm={() => setIsCompareOpen(false)}
          onCancel={() => setIsCompareOpen(false)}
        />
      )}
    </Stack>
  )
}

export default RecipientRow
