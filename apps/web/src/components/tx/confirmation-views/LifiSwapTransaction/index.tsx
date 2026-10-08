import { type SwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatUnits } from 'ethers'
import { SwapFeature } from '@/features/swap'
import { useLoadFeature } from '@/features/__core__'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import {
  LifiSwapTransactionView,
  PREVIEW_SWAP_AMOUNT_LABELS,
  PreviewSwapAmountView,
} from '@views/components/tx/confirmation-views/LifiSwapTransaction/LifiSwapTransactionView'

const PreviewSwapAmount = ({ txInfo }: { txInfo: SwapTransactionInfo }) => {
  const { SwapTokens } = useLoadFeature(SwapFeature)

  return (
    <PreviewSwapAmountView
      swapTokens={
        <SwapTokens
          first={{
            value: txInfo.fromAmount,
            label: PREVIEW_SWAP_AMOUNT_LABELS.first,
            tokenInfo: txInfo.fromToken,
          }}
          second={{
            value: txInfo.toAmount,
            label: PREVIEW_SWAP_AMOUNT_LABELS.second,
            tokenInfo: txInfo.toToken,
          }}
        />
      }
    />
  )
}

export const LifiSwapTransaction = ({ txInfo, isPreview }: { txInfo: SwapTransactionInfo; isPreview: boolean }) => {
  const totalFee = formatUnits(
    BigInt(txInfo.fees?.integratorFee ?? 0n) + BigInt(txInfo.fees?.lifiFee ?? 0n),
    txInfo.fromToken.decimals,
  )

  const fromAmountDecimals = formatUnits(txInfo.fromAmount, txInfo.fromToken.decimals)
  const toAmountDecimals = formatUnits(txInfo.toAmount, txInfo.toToken.decimals)
  const exchangeRate = Number(toAmountDecimals) / Number(fromAmountDecimals)

  return (
    <LifiSwapTransactionView
      txInfo={txInfo}
      previewAmount={isPreview ? <PreviewSwapAmount key="amount" txInfo={txInfo} /> : undefined}
      exchangeRate={exchangeRate}
      totalFee={totalFee}
      receiver={
        <NamedAddressInfo
          address={txInfo.recipient.value}
          name={txInfo.recipient.name}
          hasExplorer
          showAvatar={false}
          onlyName
          showCopyButton
        />
      }
    />
  )
}
