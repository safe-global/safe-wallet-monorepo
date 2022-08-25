import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import { getSpendingLimitInterface, getSpendingLimitModuleAddress } from '@/services/contracts/spendingLimitContracts'
import useChainId from '@/hooks/useChainId'
import { useWeb3 } from '@/hooks/wallets/web3'
import { createTx } from '@/services/tx/txSender'
import useAsync from '@/hooks/useAsync'
import { SafeTransaction } from '@gnosis.pm/safe-core-sdk-types'
import useSafeInfo from '@/hooks/useSafeInfo'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Typography } from '@mui/material'
import { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { relativeTime } from '@/utils/date'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import useBalances from '@/hooks/useBalances'
import { TokenTransferReview } from '@/components/tx/modals/TokenTransferModal/ReviewTokenTx'
import { safeFormatUnits } from '@/utils/formatters'
import SpendingLimitLabel from '@/components/common/SpendingLimitLabel'

export const RemoveSpendingLimit = ({
  data,
  onSubmit,
}: {
  data: SpendingLimitState
  onSubmit: (data: null) => void
}) => {
  const { safe } = useSafeInfo()
  const chainId = useChainId()
  const provider = useWeb3()
  const { balances } = useBalances()
  const token = balances.items.find((item) => item.tokenInfo.address === data.token)

  const [safeTx, safeTxError] = useAsync<SafeTransaction>(() => {
    const spendingLimitAddress = getSpendingLimitModuleAddress(chainId)
    if (!provider || !spendingLimitAddress) return

    const spendingLimitInterface = getSpendingLimitInterface()
    const txData = spendingLimitInterface.encodeFunctionData('deleteAllowance', [data.beneficiary, data.token])

    const txParams = {
      to: spendingLimitAddress,
      value: '0',
      data: txData,
    }

    return createTx(txParams)
  }, [provider, chainId, data.beneficiary, data.token])

  const onFormSubmit = (data: null) => {
    trackEvent(SETTINGS_EVENTS.SPENDING_LIMIT.LIMIT_REMOVED)

    onSubmit(data)
  }

  return (
    <SignOrExecuteForm safeTx={safeTx} isExecutable={safe.threshold === 1} onSubmit={onFormSubmit} error={safeTxError}>
      {token && (
        <TokenTransferReview
          amount={safeFormatUnits(data.amount, token.tokenInfo.decimals)}
          tokenInfo={token.tokenInfo}
        />
      )}
      <Typography sx={({ palette }) => ({ color: palette.secondary.light })}>Beneficiary</Typography>
      <EthHashInfo address={data.beneficiary} showCopyButton hasExplorer shortAddress={false} />
      <Typography mt={2} sx={({ palette }) => ({ color: palette.secondary.light })}>
        Reset time
      </Typography>
      <SpendingLimitLabel
        label={relativeTime(data.lastResetMin, data.resetTimeMin)}
        mb={2}
        isOneTime={data.resetTimeMin === '0'}
      />
    </SignOrExecuteForm>
  )
}
