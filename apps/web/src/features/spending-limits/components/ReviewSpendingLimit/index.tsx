import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useEffect, useMemo, useContext } from 'react'
import { Typography, Alert, Box, Stack } from '@mui/material'

import SpendingLimitLabel from '@/components/common/SpendingLimitLabel'
import { getResetTimeOptions } from '../../constants'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { selectSpendingLimits } from '../../store/spendingLimitsSlice'
import { formatVisualAmount, safeParseUnits } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { NewSpendingLimitFlowProps } from '../../types'
import EthHashInfo from '@/components/common/EthHashInfo'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import TxDetailsRow from '@/components/tx/ConfirmTxDetails/TxDetailsRow'
import { createNewSpendingLimitTx, findExistingSpendingLimit } from '../../services/spendingLimitExecution'
import { useAppSelector } from '@/store'

const ReviewSpendingLimit = ({ onSubmit, children }: ReviewTransactionProps) => {
  const { data } = useContext<TxFlowContextType<NewSpendingLimitFlowProps>>(TxFlowContext)
  const spendingLimits = useAppSelector(selectSpendingLimits)
  const { safe } = useSafeInfo()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const { balances } = useBalances()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  const resetTimeOptions = useMemo(() => getResetTimeOptions(chainId), [chainId])

  // Each row is resolved against the balances list for its token info and decimals
  const rows = useMemo(() => {
    if (!data) return []

    return data.limits.map((limit) => {
      const token = balances.items.find((item) => sameAddress(item.tokenInfo.address, limit.tokenAddress))
      const decimals = token?.tokenInfo.decimals
      const existing = findExistingSpendingLimit(spendingLimits, data.beneficiary, limit.tokenAddress)

      return {
        ...limit,
        token,
        decimals,
        existing,
        amountInWei: safeParseUnits(limit.amount || '0', decimals)?.toString() || '0',
        resetTimeLabel:
          limit.resetTime === '0'
            ? 'One-time spending limit'
            : resetTimeOptions.find((time) => time.value === limit.resetTime)?.label,
      }
    })
  }, [data, balances.items, spendingLimits, resetTimeOptions])

  useEffect(() => {
    if (!chain || !data) return

    createNewSpendingLimitTx(
      {
        beneficiary: data.beneficiary,
        limits: rows.map(({ tokenAddress, amount, resetTime, decimals }) => ({
          tokenAddress,
          amount,
          resetTime,
          decimals,
        })),
      },
      spendingLimits,
      chainId,
      chain,
      safe.modules,
      safe.deployed,
    )
      .then(setSafeTx)
      .catch(setSafeTxError)
  }, [chain, chainId, data, rows, safe.modules, safe.deployed, setSafeTx, setSafeTxError, spendingLimits])

  const replacedTokens = rows.filter((row) => row.existing).map((row) => row.token?.tokenInfo.symbol || 'token')

  const onFormSubmit = () => {
    rows.forEach((row) => {
      trackEvent({
        ...SETTINGS_EVENTS.SPENDING_LIMIT.RESET_PERIOD,
        label: row.resetTimeLabel,
      })
    })

    onSubmit()
  }

  return (
    <ReviewTransaction onSubmit={onFormSubmit} withDecodedData={false}>
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

      {rows.map((row, index) => {
        const existingAmount = row.existing ? formatVisualAmount(BigInt(row.existing.amount), row.decimals) : undefined
        const oldResetTime = row.existing
          ? resetTimeOptions.find((time) => time.value === row.existing?.resetTimeMin)?.label
          : undefined

        return (
          <Stack key={`${row.tokenAddress}-${index}`} spacing={1}>
            {row.token && (
              <SendAmountBlock amountInWei={row.amountInWei} tokenInfo={row.token.tokenInfo} title="Amount">
                {existingAmount && existingAmount !== row.amount && (
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

            <TxDetailsRow label="Reset time" grid>
              {row.existing ? (
                <SpendingLimitLabel
                  label={
                    <>
                      {row.existing.resetTimeMin !== row.resetTime && (
                        <>
                          <Typography
                            data-testid="old-reset-time"
                            color="error"
                            component="span"
                            sx={{ textDecoration: 'line-through' }}
                          >
                            {oldResetTime}
                          </Typography>
                          {' → '}
                        </>
                      )}
                      <Typography component="span">{row.resetTimeLabel}</Typography>
                    </>
                  }
                  isOneTime={row.existing.resetTimeMin === '0'}
                />
              ) : (
                <SpendingLimitLabel
                  data-testid="spending-limit-label"
                  label={row.resetTimeLabel || 'One-time spending limit'}
                  isOneTime={row.resetTime === '0'}
                />
              )}
            </TxDetailsRow>
          </Stack>
        )
      })}

      {replacedTokens.length > 0 && (
        <Alert severity="warning" sx={{ border: 'unset' }}>
          <Typography data-testid="limit-replacement-warning" fontWeight={700}>
            {replacedTokens.length === 1
              ? 'You are about to replace an existing spending limit'
              : `You are about to replace existing spending limits for ${replacedTokens.join(', ')}`}
          </Typography>
        </Alert>
      )}

      {children}
    </ReviewTransaction>
  )
}

export default ReviewSpendingLimit
