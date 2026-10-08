import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useEffect, useMemo, useContext } from 'react'

import { getResetTimeOptions } from '../../constants'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { selectSpendingLimits } from '../../store/spendingLimitsSlice'
import { formatVisualAmount, safeParseUnits } from '@safe-global/utils/utils/formatters'
import type { NewSpendingLimitFlowProps } from '../../types'
import EthHashInfo from '@/components/common/EthHashInfo'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { createNewSpendingLimitTx } from '../../services/spendingLimitExecution'
import { useAppSelector } from '@/store'
import { ReviewSpendingLimitView } from '@views/features/spending-limits/components/ReviewSpendingLimit/ReviewSpendingLimitView'

const ReviewSpendingLimit = ({ onSubmit, children }: ReviewTransactionProps) => {
  const { data } = useContext<TxFlowContextType<NewSpendingLimitFlowProps>>(TxFlowContext)
  const spendingLimits = useAppSelector(selectSpendingLimits)
  const { safe } = useSafeInfo()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const { balances } = useBalances()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const token = balances.items.find((item) => item.tokenInfo.address === data?.tokenAddress)
  const { decimals } = token?.tokenInfo || {}

  const amountInWei = useMemo(
    () => safeParseUnits(data?.amount || '0', token?.tokenInfo.decimals)?.toString() || '0',
    [data?.amount, token?.tokenInfo.decimals],
  )

  const existingSpendingLimit = useMemo(() => {
    return spendingLimits.find(
      (spendingLimit) =>
        spendingLimit.beneficiary === data?.beneficiary && spendingLimit.token.address === data?.tokenAddress,
    )
  }, [spendingLimits, data])

  useEffect(() => {
    // Decimals arrive with the balances; building without them would throw a transient error.
    if (!chain || !data || decimals == null) return

    createNewSpendingLimitTx(data, spendingLimits, chainId, chain, safe.modules, safe.deployed, decimals)
      .then(setSafeTx)
      .catch(setSafeTxError)
  }, [chain, chainId, decimals, data, safe.modules, safe.deployed, setSafeTx, setSafeTxError, spendingLimits])

  const isOneTime = data?.resetTime === '0'
  const resetTime = useMemo(() => {
    return isOneTime
      ? 'One-time spending limit'
      : getResetTimeOptions(chainId).find((time) => time.value === data?.resetTime)?.label
  }, [isOneTime, data?.resetTime, chainId])

  const onFormSubmit = () => {
    trackEvent({
      ...SETTINGS_EVENTS.SPENDING_LIMIT.RESET_PERIOD,
      label: resetTime,
    })

    onSubmit()
  }

  const existingAmount = existingSpendingLimit
    ? formatVisualAmount(BigInt(existingSpendingLimit?.amount), decimals)
    : undefined

  const oldResetTime = existingSpendingLimit
    ? getResetTimeOptions(chainId).find((time) => time.value === existingSpendingLimit?.resetTimeMin)?.label
    : undefined

  return (
    <ReviewTransaction onSubmit={onFormSubmit} withDecodedData={false}>
      <ReviewSpendingLimitView
        hasToken={!!token}
        renderAmountBlock={(title, amountChildren) =>
          token && (
            <SendAmountBlock amountInWei={amountInWei} tokenInfo={token.tokenInfo} title={title}>
              {amountChildren}
            </SendAmountBlock>
          )
        }
        beneficiaryHashInfo={
          <EthHashInfo
            address={data?.beneficiary || ''}
            shortAddress={false}
            hasExplorer
            showCopyButton
            showAvatar={false}
          />
        }
        existing={
          existingSpendingLimit
            ? {
                amount: existingAmount,
                showOldAmount: !!existingAmount && existingAmount !== data?.amount,
                resetTimeChanged: existingSpendingLimit.resetTimeMin !== data?.resetTime,
                oldResetTime,
                isOneTime: existingSpendingLimit.resetTimeMin === '0',
              }
            : undefined
        }
        resetTime={resetTime}
        isOneTime={isOneTime}
      >
        {children}
      </ReviewSpendingLimitView>
    </ReviewTransaction>
  )
}

export default ReviewSpendingLimit
