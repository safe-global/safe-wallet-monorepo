import type { TransactionDetails, TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useContext, useMemo } from 'react'
import useBalances from '@/hooks/useBalances'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SafeTransaction } from '@safe-global/types-kit'
import { Operation } from '@safe-global/store/gateway/types'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { isGtfFeePreviewAvailable, useGtfFeePreview } from '@/features/gtf'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import {
  useDomainHash,
  useMessageHash,
  useSafeTxHash,
} from '@/components/transactions/TxDetails/Summary/SafeTxHashDataRow'
import NameChip from './NameChip'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { JsonView } from './JsonView'
import { ReceiptView } from '@views/components/tx/ConfirmTxDetails/ReceiptView'

type ReceiptProps = {
  safeTxData: SafeTransaction['data']
  txData?: TransactionData | null
  txDetails?: TransactionDetails
  txInfo?: TransactionDetails['txInfo']
  grid?: boolean
  withSignatures?: boolean
  outlined?: boolean
}

export const Receipt = ({
  safeTxData,
  txData,
  txDetails,
  txInfo,
  grid,
  withSignatures = false,
  outlined = false,
}: ReceiptProps) => {
  const chain = useCurrentChain()
  const { safe, safeAddress } = useSafeInfo()
  const { safeTx, gtfPaymentMode, gtfSelectedGasToken } = useContext(SafeTxContext)
  const { balances } = useBalances()
  const operation = Number(safeTxData.operation) as Operation

  const confirmations = useMemo(() => {
    const detailedExecutionInfo = txDetails?.detailedExecutionInfo
    return isMultisigDetailedExecutionInfo(detailedExecutionInfo) ? detailedExecutionInfo.confirmations : []
  }, [txDetails?.detailedExecutionInfo])

  const shouldPreviewGtf =
    isGtfFeePreviewAvailable(chain) &&
    (!safeTx || safeTx.signatures.size === 0) &&
    gtfPaymentMode === 'safe' &&
    !!gtfSelectedGasToken
  const displayGasToken = shouldPreviewGtf ? gtfSelectedGasToken : safeTxData.gasToken
  // Show which token actually pays the gas — the logo/symbol of the native currency or of the held
  // ERC-20 — beside the bare address, which on its own says nothing about what is being spent.
  const isNativeGasToken = displayGasToken === ZERO_ADDRESS
  const heldToken = isNativeGasToken
    ? undefined
    : balances.items.find((b) => sameAddress(b.tokenInfo.address, displayGasToken))
  const gasTokenLogo = isNativeGasToken ? chain?.nativeCurrency.logoUri : heldToken?.tokenInfo.logoUri
  const gasTokenSymbol = isNativeGasToken ? chain?.nativeCurrency.symbol : heldToken?.tokenInfo.symbol

  const { data: previewData } = useGtfFeePreview({
    enabled: shouldPreviewGtf,
    safeTx,
    chain,
    safeAddress,
    gasToken: gtfSelectedGasToken,
    numberSignatures: safe.threshold,
  })

  const previewTxData = shouldPreviewGtf ? previewData?.txData : undefined
  const displayRefundReceiver = previewTxData?.refundReceiver ?? safeTxData.refundReceiver
  const displaySafeTxGas = previewTxData?.safeTxGas ?? safeTxData.safeTxGas
  const displayBaseGas = previewTxData?.baseGas ?? safeTxData.baseGas
  const displayGasPrice = previewTxData?.gasPrice ?? safeTxData.gasPrice

  // The payload actually signed in Safe-pays carries the merged GTF fee fields. Build it once so the
  // Data/JSON/Hashes tabs all reflect what the wallet will sign and not the bare pre-merge safeTx.
  const displaySafeTxData = useMemo(
    () => ({
      ...safeTxData,
      safeTxGas: displaySafeTxGas,
      baseGas: displayBaseGas,
      gasPrice: displayGasPrice,
      gasToken: displayGasToken,
      refundReceiver: displayRefundReceiver,
    }),
    [safeTxData, displaySafeTxGas, displayBaseGas, displayGasPrice, displayGasToken, displayRefundReceiver],
  )

  const safeTxHash = useSafeTxHash({ safeTxData: displaySafeTxData })
  const domainHash = useDomainHash()
  const messageHash = useMessageHash({ safeTxData: displaySafeTxData })

  return (
    <ReceiptView
      safeTxData={safeTxData}
      isCallOperation={operation === Operation.CALL}
      grid={grid}
      withSignatures={withSignatures}
      outlined={outlined}
      confirmations={confirmations}
      displaySafeTxGas={displaySafeTxGas}
      displayBaseGas={displayBaseGas}
      displayGasPrice={displayGasPrice}
      displayGasToken={displayGasToken}
      displayRefundReceiver={displayRefundReceiver}
      gasTokenLogo={gasTokenLogo}
      gasTokenSymbol={gasTokenSymbol}
      domainHash={domainHash}
      messageHash={messageHash}
      safeTxHash={safeTxHash}
      nameChip={<NameChip txData={txData} txInfo={txInfo} />}
      jsonView={<JsonView data={displaySafeTxData} />}
    />
  )
}
