import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useEffect, useMemo, useContext } from 'react'

import { getResetTimeOptions } from '../../public/constants'
import useChainId from '@/hooks/useChainId'
import useSpendingLimitTokenOptions from '@/hooks/useSpendingLimitTokenOptions'
import { findTokenOption, toTokenInfo } from '@/utils/tokenOptions'
import { trackEvent } from '@/services/analytics'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import useSpendingLimits from '../../public/hooks/useSpendingLimits'
import { formatVisualAmount, safeParseUnits } from '@safe-global/utils/utils/formatters'
import { Typography } from '@safe-global/views/components/ui/typography'
import { UntrustedTokenWarning } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/TokenSelector/SelectedTokenHelper'
import type { NewSpendingLimitFlowProps } from '../../public/types'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { createNewSpendingLimitTx } from '../../public/services/spendingLimitExecution'
import SpendingLimitReviewDetails from './SpendingLimitReviewDetails'

const ReviewSpendingLimit = ({ onSubmit, children }: ReviewTransactionProps) => {
  const { data } = useContext<TxFlowContextType<NewSpendingLimitFlowProps>>(TxFlowContext)
  const { spendingLimits } = useSpendingLimits()
  const { safe } = useSafeInfo()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const { options } = useSpendingLimitTokenOptions()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const token = findTokenOption(options, data?.tokenAddress)
  const decimals = token?.decimals

  const amountInWei = useMemo(
    () => safeParseUnits(data?.amount || '0', decimals)?.toString() || '0',
    [data?.amount, decimals],
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

  const replaces = useMemo(() => {
    if (!existingSpendingLimit) return undefined

    const previousAmount = formatVisualAmount(BigInt(existingSpendingLimit.amount), decimals)
    const previousResetTime = getResetTimeOptions(chainId).find(
      (time) => time.value === existingSpendingLimit.resetTimeMin,
    )?.label

    return {
      previousAmount: BigInt(existingSpendingLimit.amount) !== BigInt(amountInWei) ? previousAmount : undefined,
      previousResetTime: existingSpendingLimit.resetTimeMin !== data?.resetTime ? previousResetTime : undefined,
    }
  }, [existingSpendingLimit, decimals, chainId, amountInWei, data?.resetTime])

  return (
    <ReviewTransaction onSubmit={onFormSubmit} withDecodedData={false}>
      <SpendingLimitReviewDetails
        tokenInfo={token && toTokenInfo(token)}
        amountInWei={amountInWei}
        beneficiary={data?.beneficiary || ''}
        resetTime={resetTime || 'One-time spending limit'}
        isOneTime={existingSpendingLimit ? existingSpendingLimit.resetTimeMin === '0' : isOneTime}
        replaces={replaces}
      />

      {token?.untrusted && (
        <Typography variant="paragraph-small">
          <UntrustedTokenWarning />
        </Typography>
      )}

      {children}
    </ReviewTransaction>
  )
}

export default ReviewSpendingLimit
