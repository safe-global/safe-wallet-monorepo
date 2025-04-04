import { type ReactElement } from 'react'
import { Box, Divider, Stack, Typography } from '@mui/material'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { PaperViewToggle } from '../../common/PaperViewToggle'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Operation, type TransactionData } from '@safe-global/safe-gateway-typescript-sdk/dist/types/transactions'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import {
  useDomainHash,
  useMessageHash,
  useSafeTxHash,
} from '@/components/transactions/TxDetails/Summary/SafeTxHashDataRow'
import TxDetailsRow from './TxDetailsRow'
import NameChip from './NameChip'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'

type TxDetailsProps = {
  safeTxData: SafeTransaction['data']
  txData?: TransactionData
  grid?: boolean
}

const ContentWrapper = ({ children }: { children: ReactElement | ReactElement[] }) => (
  <Box sx={{ maxHeight: '550px', minHeight: '447px', overflowY: 'auto', px: 2 }}>{children}</Box>
)

export const TxDetails = ({ safeTxData, txData, grid }: TxDetailsProps) => {
  const safeTxHash = useSafeTxHash({ safeTxData })
  const domainHash = useDomainHash()
  const messageHash = useMessageHash({ safeTxData })

  return (
    <PaperViewToggle withBackground={!grid} activeView={0}>
      {[
        {
          title: 'Data',
          content: (
            <ContentWrapper>
              <Stack spacing={1} divider={<Divider />}>
                <TxDetailsRow label="Primary type" grid={grid}>
                  SafeTx
                </TxDetailsRow>

                <TxDetailsRow label="To" grid={grid}>
                  {!grid && <NameChip txData={txData} withBackground={grid} />}

                  {grid ? (
                    <Typography variant="body2">
                      <NamedAddressInfo
                        address={safeTxData.to}
                        avatarSize={20}
                        showPrefix={false}
                        shortAddress={false}
                        hasExplorer
                        showAvatar
                        highlight4bytes
                      />
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      width="100%"
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
                  )}
                </TxDetailsRow>

                <TxDetailsRow label="Value" grid={grid}>
                  {safeTxData.value}
                </TxDetailsRow>

                <TxDetailsRow label="Data" grid={grid}>
                  <Typography variant="body2" width={grid ? '70%' : undefined}>
                    <HexEncodedData hexData={safeTxData.data} limit={66} />
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="Operation" grid={grid}>
                  {safeTxData.operation} (
                  {(Number(safeTxData.operation) as Operation) === Operation.CALL ? 'call' : 'delegate call'})
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
              </Stack>
            </ContentWrapper>
          ),
        },
        {
          title: 'Hashes',
          content: (
            <ContentWrapper>
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
            </ContentWrapper>
          ),
        },
      ]}
    </PaperViewToggle>
  )
}
