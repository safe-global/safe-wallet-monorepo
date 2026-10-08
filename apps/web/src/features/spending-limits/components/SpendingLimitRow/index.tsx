import { Controller, useFormContext } from 'react-hook-form'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

import { TokenAmountFields } from '@/components/tx-flow/flows/TokenTransfer/types'
import { useContext, useEffect } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useHasPermission } from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { TokenTransferType, MultiTransfersFields } from '@/components/tx-flow/flows/TokenTransfer'
import { SpendingLimitRowView } from '@views/features/spending-limits/components/SpendingLimitRow/SpendingLimitRowView'

const SpendingLimitRow = ({
  availableAmount,
  selectedToken,
}: {
  availableAmount: bigint
  selectedToken: Balance['tokenInfo'] | undefined
}) => {
  const { control, trigger, resetField } = useFormContext()
  const canCreateStandardTx = useHasPermission(Permission.CreateTransaction)
  const canCreateSpendingLimitTx = useHasPermission(Permission.CreateSpendingLimitTransaction, {
    tokenAddress: selectedToken?.address,
  })
  const { setNonceNeeded } = useContext(SafeTxContext)

  const formattedAmount = safeFormatUnits(availableAmount, selectedToken?.decimals)

  useEffect(() => {
    return () => {
      // reset the field value to default when the component is unmounted
      resetField(MultiTransfersFields.type)
    }
  }, [resetField])

  return (
    <SpendingLimitRowView
      canCreateStandardTx={canCreateStandardTx}
      canCreateSpendingLimitTx={canCreateSpendingLimitTx}
      formattedAmount={formattedAmount}
      tokenSymbol={selectedToken?.symbol}
      renderController={(renderRadioGroup) => (
        <Controller
          rules={{ required: true }}
          control={control}
          name={MultiTransfersFields.type}
          render={({ field: { onChange, value } }) =>
            renderRadioGroup({
              value,
              onValueChange: (newValue) => {
                onChange(newValue)

                setNonceNeeded(newValue === TokenTransferType.multiSig)

                // Validate only after the field is changed
                setTimeout(() => {
                  trigger(TokenAmountFields.amount)
                }, 10)
              },
            })
          }
        />
      )}
    />
  )
}

export default SpendingLimitRow
