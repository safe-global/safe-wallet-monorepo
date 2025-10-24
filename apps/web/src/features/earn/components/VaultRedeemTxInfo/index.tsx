import TokenAmount from '@/components/common/TokenAmount'
import type { VaultRedeemTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const VaultRedeemTxInfo = ({ txInfo }: { txInfo: VaultRedeemTransactionInfo }) => {
  return (
    <TokenAmount
      logoUri={txInfo.tokenInfo.logoUri!}
      value={txInfo.value}
      tokenSymbol={txInfo.tokenInfo.symbol}
      decimals={txInfo.tokenInfo.decimals}
    />
  )
}

export default VaultRedeemTxInfo
