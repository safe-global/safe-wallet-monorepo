import type { TransactionDetails, TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Fragment, useContext, useMemo, type ElementType, type ReactElement, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import type { SafeTransaction } from '@safe-global/types-kit'
import { PaperViewToggle } from '../../common/PaperViewToggle'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Operation } from '@safe-global/store/gateway/types'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useGtfFeePreview } from '@/features/gtf'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import {
  useDomainHash,
  useMessageHash,
  useSafeTxHash,
} from '@/components/transactions/TxDetails/Summary/SafeTxHashDataRow'
import TxDetailsRow from './TxDetailsRow'
import NameChip from './NameChip'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { JsonView } from './JsonView'

type ReceiptProps = {
  safeTxData: SafeTransaction['data']
  txData?: TransactionData | null
  txDetails?: TransactionDetails
  txInfo?: TransactionDetails['txInfo']
  grid?: boolean
  withSignatures?: boolean
}

const ScrollWrapper = ({ children }: { children: ReactElement | ReactElement[] }) => (
  <div className="max-h-[550px] flex-1 overflow-y-auto px-4 pt-2">{children}</div>
)

const DataStack = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col divide-y divide-[var(--color-border-light)] [&>*]:py-2 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
    {children}
  </div>
)

export const Receipt = ({ safeTxData, txData, txDetails, txInfo, grid, withSignatures = false }: ReceiptProps) => {
  const chain = useCurrentChain()
  const { safe, safeAddress } = useSafeInfo()
  const { safeTx, gtfPaymentMode, gtfSelectedGasToken } = useContext(SafeTxContext)
  const isGtfChain = useHasFeature(FEATURES.GTF) ?? false
  const operation = Number(safeTxData.operation) as Operation

  const ToWrapper: ElementType = grid ? 'div' : Fragment

  const confirmations = useMemo(() => {
    const detailedExecutionInfo = txDetails?.detailedExecutionInfo
    return isMultisigDetailedExecutionInfo(detailedExecutionInfo) ? detailedExecutionInfo.confirmations : []
  }, [txDetails?.detailedExecutionInfo])

  const shouldPreviewGtf =
    isGtfChain && (!safeTx || safeTx.signatures.size === 0) && gtfPaymentMode === 'safe' && !!gtfSelectedGasToken
  const displayGasToken = shouldPreviewGtf ? gtfSelectedGasToken : safeTxData.gasToken

  const { data: previewData } = useGtfFeePreview({
    enabled: shouldPreviewGtf,
    safeTx,
    chainId: chain?.chainId,
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
    <PaperViewToggle activeView={0} leftAlign={grid}>
      {[
        {
          title: 'Data',
          content: (
            <ScrollWrapper>
              <DataStack>
                <TxDetailsRow label="To" grid={grid}>
                  <ToWrapper>
                    <NameChip txData={txData} txInfo={txInfo} />

                    <Typography
                      variant="paragraph-small"
                      className={cn(
                        '[&_*]:whitespace-normal [&_*]:break-words [&_*]:!items-start',
                        grid ? 'mt-1.5' : 'w-full',
                      )}
                    >
                      <EthHashInfo
                        address={safeTxData.to}
                        avatarSize={20}
                        showPrefix={false}
                        showName={false}
                        shortAddress={false}
                        hasExplorer
                        showAvatar
                        highlight4bytes
                      />
                    </Typography>
                  </ToWrapper>
                </TxDetailsRow>

                <TxDetailsRow label="Value" grid={grid}>
                  {safeTxData.value}
                </TxDetailsRow>

                <TxDetailsRow label="Data" grid={grid}>
                  <Typography variant="paragraph-small" className={grid ? 'w-[70%]' : undefined}>
                    <HexEncodedData hexData={safeTxData.data} limit={140} />
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="Operation" grid={grid}>
                  <Typography variant="paragraph-small" className="flex items-center gap-1">
                    {safeTxData.operation} ({operation === Operation.CALL ? 'call' : 'delegate call'})
                    {operation === Operation.CALL && <Check className="size-[1em] text-[var(--color-success-main)]" />}
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="SafeTxGas" grid={grid}>
                  {displaySafeTxGas}
                </TxDetailsRow>

                <TxDetailsRow label="BaseGas" grid={grid}>
                  {displayBaseGas}
                </TxDetailsRow>

                <TxDetailsRow label="GasPrice" grid={grid}>
                  {displayGasPrice}
                </TxDetailsRow>

                <TxDetailsRow label="GasToken" grid={grid}>
                  <Typography variant="paragraph-small">
                    <EthHashInfo
                      address={displayGasToken}
                      avatarSize={20}
                      showPrefix={false}
                      showName={false}
                      shortAddress
                      hasExplorer
                    />
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="RefundReceiver" grid={grid}>
                  <Typography variant="paragraph-small">
                    <EthHashInfo
                      address={displayRefundReceiver}
                      avatarSize={20}
                      showPrefix={false}
                      shortAddress
                      showName={false}
                      hasExplorer
                    />
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="Nonce" grid={grid}>
                  {safeTxData.nonce}
                </TxDetailsRow>

                {withSignatures &&
                  confirmations?.map(
                    ({ signature }, index) =>
                      !!signature && (
                        <TxDetailsRow
                          data-testid="tx-signature"
                          label={`Signature ${index + 1}`}
                          key={`signature-${index}`}
                          grid={grid}
                        >
                          <Typography variant="paragraph-small" className={grid ? 'w-[70%]' : undefined}>
                            <HexEncodedData hexData={signature} highlightFirstBytes={false} limit={30} />
                          </Typography>
                        </TxDetailsRow>
                      ),
                  )}
              </DataStack>
            </ScrollWrapper>
          ),
        },
        {
          title: 'Hashes',
          content: (
            <ScrollWrapper>
              <DataStack>
                {domainHash && (
                  <TxDetailsRow label="Domain hash" grid={grid}>
                    <Typography variant="paragraph-small" className="w-full break-words">
                      <HexEncodedData hexData={domainHash} limit={66} highlightFirstBytes={false} />
                    </Typography>
                  </TxDetailsRow>
                )}

                {messageHash && (
                  <TxDetailsRow label="Message hash" grid={grid}>
                    <Typography variant="paragraph-small" className="w-full break-words">
                      <HexEncodedData hexData={messageHash} limit={66} highlightFirstBytes={false} />
                    </Typography>
                  </TxDetailsRow>
                )}

                {safeTxHash && (
                  <TxDetailsRow label="safeTxHash" grid={grid}>
                    <Typography variant="paragraph-small" className="w-full break-words">
                      <HexEncodedData hexData={safeTxHash} limit={66} highlightFirstBytes={false} />
                    </Typography>
                  </TxDetailsRow>
                )}
              </DataStack>
            </ScrollWrapper>
          ),
        },
        {
          title: 'JSON',
          content: (
            <ScrollWrapper>
              <JsonView data={displaySafeTxData} />
            </ScrollWrapper>
          ),
        },
      ]}
    </PaperViewToggle>
  )
}
