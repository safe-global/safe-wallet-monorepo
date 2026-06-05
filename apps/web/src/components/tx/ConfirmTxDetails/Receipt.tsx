import type { TransactionDetails, TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Fragment, useContext, useMemo, type ReactElement } from 'react'
import { Box, Divider, Stack, Tooltip, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import TokenIcon from '@/components/common/TokenIcon'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useBalances from '@/hooks/useBalances'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SafeTransaction } from '@safe-global/types-kit'
import { PaperViewToggle } from '../../common/PaperViewToggle'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Operation } from '@safe-global/store/gateway/types'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useGtfFeePreview } from '@/features/gtf/hooks/useGtfFeePreview'
import useSafeInfo from '@/hooks/useSafeInfo'
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
  <Box sx={{ maxHeight: '550px', flex: 1, overflowY: 'auto', px: 2, pt: 1, mt: '0 !important' }}>{children}</Box>
)

const inlineEthHashInfoSx = { '& > div': { width: 'auto' } }

export const Receipt = ({ safeTxData, txData, txDetails, txInfo, grid, withSignatures = false }: ReceiptProps) => {
  const chain = useCurrentChain()
  const { safe, safeAddress } = useSafeInfo()
  const { safeTx, gtfPaymentMode, gtfSelectedGasToken } = useContext(SafeTxContext)
  const isGtfChain = useHasFeature(FEATURES.GTF) ?? false
  const { balances } = useBalances()
  const operation = Number(safeTxData.operation) as Operation

  const ToWrapper = grid ? Box : Fragment

  const confirmations = useMemo(() => {
    const detailedExecutionInfo = txDetails?.detailedExecutionInfo
    return isMultisigDetailedExecutionInfo(detailedExecutionInfo) ? detailedExecutionInfo.confirmations : []
  }, [txDetails?.detailedExecutionInfo])

  const shouldPreviewGtf =
    isGtfChain && (!safeTx || safeTx.signatures.size === 0) && gtfPaymentMode === 'safe' && !!gtfSelectedGasToken
  const displayGasToken = shouldPreviewGtf ? gtfSelectedGasToken : safeTxData.gasToken
  const isNativeGasToken = displayGasToken === ZERO_ADDRESS
  const heldToken = isNativeGasToken
    ? undefined
    : balances.items.find((b) => sameAddress(b.tokenInfo.address, displayGasToken))
  const gasTokenLogo = isNativeGasToken ? chain?.nativeCurrency.logoUri : heldToken?.tokenInfo.logoUri
  const gasTokenSymbol = isNativeGasToken ? chain?.nativeCurrency.symbol : heldToken?.tokenInfo.symbol

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
              <Stack spacing={1} divider={<Divider />}>
                <TxDetailsRow label="To" grid={grid}>
                  <ToWrapper>
                    <NameChip txData={txData} txInfo={txInfo} />

                    <Typography
                      variant="body2"
                      mt={grid ? 0.75 : 0}
                      width={grid ? undefined : '100%'}
                      sx={{
                        '& *': { whiteSpace: 'normal', wordWrap: 'break-word', alignItems: 'flex-start !important' },
                      }}
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
                  <Typography variant="body2" width={grid ? '70%' : undefined}>
                    <HexEncodedData hexData={safeTxData.data} limit={140} />
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="Operation" grid={grid}>
                  <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                    {safeTxData.operation} ({operation === Operation.CALL ? 'call' : 'delegate call'})
                    {operation === Operation.CALL && <CheckIcon color="success" fontSize="inherit" />}
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
                  <Typography variant="body2" sx={inlineEthHashInfoSx}>
                    <EthHashInfo
                      address={displayGasToken}
                      showAvatar={false}
                      showPrefix={false}
                      showName={false}
                      shortAddress
                      hasExplorer
                    >
                      {gasTokenLogo && gasTokenSymbol && (
                        <Tooltip
                          title="The GasToken address is the address of the token used to pay gas fees."
                          placement="top"
                          arrow
                        >
                          <span style={{ display: 'inline-flex' }}>
                            <TokenIcon logoUri={gasTokenLogo} tokenSymbol={gasTokenSymbol} size={16} />
                          </span>
                        </Tooltip>
                      )}
                    </EthHashInfo>
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="RefundReceiver" grid={grid}>
                  <Typography variant="body2" sx={inlineEthHashInfoSx}>
                    <EthHashInfo
                      address={displayRefundReceiver}
                      showAvatar={false}
                      showPrefix={false}
                      shortAddress
                      showName={false}
                      hasExplorer
                    >
                      <Tooltip
                        title="The RefundReceiver address is the one that will be reimbursed for the gas costs of executing this transaction."
                        placement="top"
                        arrow
                      >
                        <CheckIcon color="success" sx={{ fontSize: '16px', ml: 0.5 }} />
                      </Tooltip>
                    </EthHashInfo>
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
                          <Typography variant="body2" width={grid ? '70%' : undefined}>
                            <HexEncodedData hexData={signature} highlightFirstBytes={false} limit={30} />
                          </Typography>
                        </TxDetailsRow>
                      ),
                  )}
              </Stack>
            </ScrollWrapper>
          ),
        },
        {
          title: 'Hashes',
          content: (
            <ScrollWrapper>
              <Stack spacing={1} divider={<Divider />}>
                {domainHash && (
                  <TxDetailsRow label="Domain hash" grid={grid}>
                    <Typography variant="body2" width="100%" sx={{ wordWrap: 'break-word' }}>
                      <HexEncodedData hexData={domainHash} limit={66} highlightFirstBytes={false} />
                    </Typography>
                  </TxDetailsRow>
                )}

                {messageHash && (
                  <TxDetailsRow label="Message hash" grid={grid}>
                    <Typography variant="body2" width="100%" sx={{ wordWrap: 'break-word' }}>
                      <HexEncodedData hexData={messageHash} limit={66} highlightFirstBytes={false} />
                    </Typography>
                  </TxDetailsRow>
                )}

                {safeTxHash && (
                  <TxDetailsRow label="safeTxHash" grid={grid}>
                    <Typography variant="body2" width="100%" sx={{ wordWrap: 'break-word' }}>
                      <HexEncodedData hexData={safeTxHash} limit={66} highlightFirstBytes={false} />
                    </Typography>
                  </TxDetailsRow>
                )}
              </Stack>
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
