import type { SubmitCallback } from '@/components/tx/SignOrExecuteForm'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import { getSpendingLimitInterface, getSpendingLimitModuleAddress } from '@/services/contracts/spendingLimitContracts'
import useChainId from '@/hooks/useChainId'
import { useContext, useEffect } from 'react'
import { SafeTxContext } from '../../SafeTxProvider'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Grid, Typography } from '@mui/material'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { relativeTime } from '@/utils/date'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import useBalances from '@/hooks/useBalances'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import { safeFormatUnits } from '@/utils/formatters'
import SpendingLimitLabel from '@/components/common/SpendingLimitLabel'
import { createTx } from '@/services/tx/tx-sender'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'

const onFormSubmit: SubmitCallback = (_, isExecuted) => {
  trackEvent(SETTINGS_EVENTS.SPENDING_LIMIT.LIMIT_REMOVED)
  trackEvent({ ...TX_EVENTS.CREATE, label: TX_TYPES.spending_limit_remove })
  if (isExecuted) {
    trackEvent({ ...TX_EVENTS.EXECUTE, label: TX_TYPES.spending_limit_remove })
  }
}

export const RemoveSpendingLimit = ({ params }: { params: SpendingLimitState }) => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const chainId = useChainId()
  const { balances } = useBalances()
  const token = balances.items.find((item) => item.tokenInfo.address === params.token.address)

  useEffect(() => {
    const spendingLimitAddress = getSpendingLimitModuleAddress(chainId)

    if (!spendingLimitAddress) {
      return
    }

    const spendingLimitInterface = getSpendingLimitInterface()
    const txData = spendingLimitInterface.encodeFunctionData('deleteAllowance', [
      params.beneficiary,
      params.token.address,
    ])

    const txParams = {
      to: spendingLimitAddress,
      value: '0',
      data: txData,
    }

    createTx(txParams).then(setSafeTx).catch(setSafeTxError)
  }, [chainId, params.beneficiary, params.token, setSafeTx, setSafeTxError])

  return (
    <SignOrExecuteForm onSubmit={onFormSubmit}>
      {token && (
        <SendAmountBlock
          amount={safeFormatUnits(params.amount, token.tokenInfo.decimals)}
          tokenInfo={token.tokenInfo}
          title="Amount"
        />
      )}

      <Grid container gap={1} alignItems="center">
        <Grid item md>
          <Typography variant="body2" color="text.secondary">
            Beneficiary
          </Typography>
        </Grid>
        <Grid item md={10}>
          <EthHashInfo
            address={params.beneficiary}
            showCopyButton
            hasExplorer
            shortAddress={false}
            showAvatar={false}
          />
        </Grid>
      </Grid>

      <Grid container gap={1} alignItems="center">
        <Grid item md>
          <Typography variant="body2" color="text.secondary">
            Reset time
          </Typography>
        </Grid>
        <Grid item md={10}>
          <SpendingLimitLabel
            label={relativeTime(params.lastResetMin, params.resetTimeMin)}
            isOneTime={params.resetTimeMin === '0'}
          />
        </Grid>
      </Grid>
    </SignOrExecuteForm>
  )
}
