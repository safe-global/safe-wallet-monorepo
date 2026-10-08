import ChainIndicator from '@/components/common/ChainIndicator'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { type BridgeAndSwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatUnits } from 'ethers'
import { BridgeTransactionView } from '@views/components/tx/confirmation-views/BridgeTransaction/BridgeTransactionView'

interface BridgeTransactionProps {
  txInfo: BridgeAndSwapTransactionInfo
  showWarnings?: boolean
}

function BridgeTransaction({ txInfo }: BridgeTransactionProps) {
  const chainId = useChainId()
  const { configs } = useChains()

  const totalFee = formatUnits(
    BigInt(txInfo.fees?.integratorFee ?? 0n) + BigInt(txInfo.fees?.lifiFee ?? 0n),
    txInfo.fromToken.decimals,
  )

  const showsAmount = ['PENDING', 'AWAITING_EXECUTION', 'FAILED', 'DONE'].includes(txInfo.status)
  const actualFromAmount = showsAmount
    ? BigInt(txInfo.fromAmount) + BigInt(txInfo.fees?.integratorFee ?? 0n) + BigInt(txInfo.fees?.lifiFee ?? 0n)
    : 0n

  let exchangeRate: number | undefined
  let fromChainName: string | undefined
  let toChainName: string | undefined
  if (txInfo.status === 'DONE') {
    const fromAmountDecimals = formatUnits(actualFromAmount, txInfo.fromToken.decimals)
    const toAmountDecimals =
      txInfo.toAmount && txInfo.toToken ? formatUnits(txInfo.toAmount, txInfo.toToken.decimals) : undefined
    exchangeRate = toAmountDecimals ? Number(toAmountDecimals) / Number(fromAmountDecimals) : undefined
    fromChainName = configs.find((config) => config.chainId === chainId)?.chainName
    toChainName = configs.find((config) => config.chainId === txInfo.toChain)?.chainName
  }

  return (
    <BridgeTransactionView
      txInfo={txInfo}
      chainId={chainId}
      actualFromAmount={actualFromAmount.toString()}
      totalFee={totalFee}
      exchangeRate={exchangeRate}
      fromChainName={fromChainName}
      toChainName={toChainName}
      toChainIndicator={<ChainIndicator chainId={txInfo.toChain} inline />}
      recipient={
        <NamedAddressInfo
          address={txInfo.recipient.value}
          showCopyButton
          hasExplorer
          showAvatar={false}
          onlyName
          showPrefix
          chainId={txInfo.toChain}
        />
      }
    />
  )
}

export default BridgeTransaction
