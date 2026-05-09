import type { NativeStakingWithdrawTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import TokenAmount from '@/components/common/TokenAmount'

const StakingTxWithdrawInfo = ({ info }: { info: NativeStakingWithdrawTransactionInfo }) => {
  return (
    <>
      <TokenAmount
        value={info.value}
        tokenSymbol={info.tokenInfo.symbol}
        decimals={info.tokenInfo.decimals}
        logoUri={info.tokenInfo.logoUri}
      />
    </>
  )
}

export default StakingTxWithdrawInfo
