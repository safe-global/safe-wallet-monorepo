import {
  getSpendingLimitInterface,
  getDeployedSpendingLimitModuleAddress,
} from '@/services/contracts/spendingLimitContracts'
import useChainId from '@/hooks/useChainId'
import { useCallback, useContext, useEffect } from 'react'
import { SafeTxContext } from '../../SafeTxProvider'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Grid, Typography } from '@mui/material'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { relativeTime } from '@safe-global/utils/utils/date'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import useBalances from '@/hooks/useBalances'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import SpendingLimitLabel from '@/components/common/SpendingLimitLabel'
import { createTx } from '@/services/tx/tx-sender'
import useSafeInfo from '@/hooks/useSafeInfo'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

export const RemoveSpendingLimit = ({ params, onSubmit }: { params: SpendingLimitState; onSubmit: () => void }) => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const chainId = useChainId()
  const { safe } = useSafeInfo()
  const { balances } = useBalances()
  const token = balances.items.find((item) => item.tokenInfo.address === params.token.address)

  const amountInWei = params.amount

  useEffect(() => {
    if (!safe.modules?.length) return

    const spendingLimitAddress = getDeployedSpendingLimitModuleAddress(chainId, safe.modules)
    if (!spendingLimitAddress) return

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
  }, [chainId, params.beneficiary, params.token, setSafeTx, setSafeTxError, safe.modules])

  const onFormSubmit = useCallback(() => {
    trackEvent(SETTINGS_EVENTS.SPENDING_LIMIT.LIMIT_REMOVED)
    onSubmit()
  }, [onSubmit])

  return (
    <ReviewTransaction onSubmit={onFormSubmit}>
      {token && <SendAmountBlock amountInWei={amountInWei} tokenInfo={token.tokenInfo} title="Amount" />}
      <Grid
        container
        sx={{
          gap: 1,
          alignItems: 'center',
        }}
      >
        <Grid item md>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
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
      <Grid
        container
        sx={{
          gap: 1,
          alignItems: 'center',
        }}
      >
        <Grid item md>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
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
    </ReviewTransaction>
  )
}
