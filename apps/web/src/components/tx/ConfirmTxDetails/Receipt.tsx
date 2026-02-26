import type { TransactionDetails, TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Fragment, useMemo, type ReactElement } from 'react'
import { Box, Divider, Stack, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import type { SafeTransaction } from '@safe-global/types-kit'
import { PaperViewToggle } from '../../common/PaperViewToggle'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Operation } from '@safe-global/store/gateway/types'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import {
  useDomainHash,
  useMessageHash,
  useSafeTxHash,
} from '@/components/transactions/TxDetails/Summary/SafeTxHashDataRow'
import TxDetailsRow from './TxDetailsRow'
import NameChip from './NameChip'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { JsonView } from './JsonView'
import useCustomAbiDecoding from '@/hooks/useCustomAbiDecoding'
import { MethodDetails } from '@/components/transactions/TxDetails/TxData/DecodedData/MethodDetails'

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

export const Receipt = ({ safeTxData, txData, txDetails, txInfo, grid, withSignatures = false }: ReceiptProps) => {
  const safeTxHash = useSafeTxHash({ safeTxData })
  const domainHash = useDomainHash()
  const messageHash = useMessageHash({ safeTxData })
  const operation = Number(safeTxData.operation) as Operation
  const customDecoded = useCustomAbiDecoding(safeTxData.data, safeTxData.to)
  const effectiveDecoded = txData?.dataDecoded ?? customDecoded
  const isCustomDecoded = !txData?.dataDecoded && !!customDecoded

  const ToWrapper = grid ? Box : Fragment

  const confirmations = useMemo(() => {
    const detailedExecutionInfo = txDetails?.detailedExecutionInfo
    return isMultisigDetailedExecutionInfo(detailedExecutionInfo) ? detailedExecutionInfo.confirmations : []
  }, [txDetails?.detailedExecutionInfo])

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
                  <Box width={grid ? '70%' : undefined}>
                    {effectiveDecoded && (
                      <Box mb={1}>
                        <Typography variant="body2" fontWeight={700} mb={0.5}>
                          {effectiveDecoded.method}
                        </Typography>
                        {isCustomDecoded && (
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            Decoded with custom ABI
                          </Typography>
                        )}
                        <MethodDetails data={effectiveDecoded} />
                      </Box>
                    )}
                    <Typography variant="body2">
                      <HexEncodedData hexData={safeTxData.data} limit={140} />
                    </Typography>
                  </Box>
                </TxDetailsRow>

                <TxDetailsRow label="Operation" grid={grid}>
                  <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                    {safeTxData.operation} ({operation === Operation.CALL ? 'call' : 'delegate call'})
                    {operation === Operation.CALL && <CheckIcon color="success" fontSize="inherit" />}
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="SafeTxGas" grid={grid}>
                  {safeTxData.safeTxGas}
                </TxDetailsRow>

                <TxDetailsRow label="BaseGas" grid={grid}>
                  {safeTxData.baseGas}
                </TxDetailsRow>

                <TxDetailsRow label="GasPrice" grid={grid}>
                  {safeTxData.gasPrice}
                </TxDetailsRow>

                <TxDetailsRow label="GasToken" grid={grid}>
                  <Typography variant="body2">
                    <EthHashInfo
                      address={safeTxData.gasToken}
                      avatarSize={20}
                      showPrefix={false}
                      showName={false}
                      shortAddress
                      hasExplorer
                    />
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="RefundReceiver" grid={grid}>
                  <Typography variant="body2">
                    <EthHashInfo
                      address={safeTxData.refundReceiver}
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
              <JsonView data={safeTxData} />
            </ScrollWrapper>
          ),
        },
      ]}
    </PaperViewToggle>
  )
}
