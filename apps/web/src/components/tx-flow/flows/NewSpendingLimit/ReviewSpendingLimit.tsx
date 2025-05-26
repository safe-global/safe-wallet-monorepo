import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useEffect, useMemo, useContext } from 'react'
import { useSelector } from 'react-redux'
import { Typography, Alert, Box } from '@mui/material'

import SpendingLimitLabel from '@/components/common/SpendingLimitLabel'
import { getResetTimeOptions } from '@/components/transactions/TxDetails/TxData/SpendingLimits'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { createNewSpendingLimitTx } from '@/services/tx/tx-sender'
import { selectSpendingLimits } from '@/store/spendingLimitsSlice'
import { formatVisualAmount, safeParseUnits } from '@safe-global/utils/utils/formatters'
import type { NewSpendingLimitFlowProps } from '.'
import EthHashInfo from '@/components/common/EthHashInfo'
import { SafeTxContext } from '../../SafeTxProvider'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'
import TxDetailsRow from '@/components/tx/ConfirmTxDetails/TxDetailsRow'

export const ReviewSpendingLimit = ({ onSubmit, children }: ReviewTransactionProps) => {
  const { data } = useContext<TxFlowContextType<NewSpendingLimitFlowProps>>(TxFlowContext)
  const spendingLimits = useSelector(selectSpendingLimits)
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
    if (!chain || !data) return

    createNewSpendingLimitTx(
      data,
      spendingLimits,
      chainId,
      chain,
      safe.modules,
      safe.deployed,
      decimals,
      existingSpendingLimit,
    )
      .then(setSafeTx)
      .catch(setSafeTxError)
  }, [
    chain,
    chainId,
    decimals,
    existingSpendingLimit,
    data,
    safe.modules,
    safe.deployed,
    setSafeTx,
    setSafeTxError,
    spendingLimits,
  ])

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
      {token && (
        <SendAmountBlock amountInWei={amountInWei} tokenInfo={token.tokenInfo} title="Amount">
          {existingAmount && existingAmount !== data?.amount && (
            <>
              <Typography
                data-testid="old-token-amount"
                color="error"
                sx={{ textDecoration: 'line-through' }}
                component="span"
              >
                {existingAmount}
              </Typography>
              →
            </>
          )}
        </SendAmountBlock>
      )}

      <TxDetailsRow label="Beneficiary" grid>
        <Box data-testid="beneficiary-address">
          <EthHashInfo
            address={data?.beneficiary || ''}
            shortAddress={false}
            hasExplorer
            showCopyButton
            showAvatar={false}
          />
        </Box>
      </TxDetailsRow>

      <TxDetailsRow label="Reset time" grid>
        {existingSpendingLimit ? (
          <>
            <SpendingLimitLabel
              label={
                <>
                  {existingSpendingLimit.resetTimeMin !== data?.resetTime && (
                    <>
                      <Typography
                        data-testid="old-reset-time"
                        color="error"
                        component="span"
                        sx={{
                          textDecoration: 'line-through',
                        }}
                      >
                        {oldResetTime}
                      </Typography>
                      {' → '}
                    </>
                  )}
                  <Typography component="span">{resetTime}</Typography>
                </>
              }
              isOneTime={existingSpendingLimit.resetTimeMin === '0'}
            />
          </>
        ) : (
          <SpendingLimitLabel
            data-testid="spending-limit-label"
            label={resetTime || 'One-time spending limit'}
            isOneTime={!!resetTime && isOneTime}
          />
        )}
      </TxDetailsRow>

      {existingSpendingLimit && (
        <Alert severity="warning" sx={{ border: 'unset' }}>
          <Typography data-testid="limit-replacement-warning" fontWeight={700}>
            You are about to replace an existing spending limit
          </Typography>
        </Alert>
      )}

      {children}
    </ReviewTransaction>
  )
}
