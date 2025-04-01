import type { StackProps } from '@mui/material'
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { PaperViewToggle } from '../../common/PaperViewToggle'
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded'
import DataObjectIcon from '@mui/icons-material/DataObject'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useState, type ReactElement, type ReactNode } from 'react'
import { isNumber, isString } from 'lodash'
import { Operation, type TransactionData } from '@safe-global/safe-gateway-typescript-sdk/dist/types/transactions'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import {
  useDomainHash,
  useMessageHash,
  useSafeTxHash,
} from '@/components/transactions/TxDetails/Summary/SafeTxHashDataRow'

type TxDetailsProps = {
  safeTxData: SafeTransaction['data']
  txData?: TransactionData
  showHashes: boolean
  noTitle?: boolean
}

const TxDetailsRow = ({
  label,
  children,
  direction = 'row',
}: {
  label: string
  children: ReactNode
  direction?: StackProps['direction']
}) => (
  <Stack
    gap={1}
    direction={direction}
    justifyContent="space-between"
    flexWrap={direction === 'row' ? 'wrap' : 'initial'}
    alignItems={direction === 'row' ? 'center' : 'initial'}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    {isString(children) || isNumber(children) ? <Typography variant="body2">{children}</Typography> : children}
  </Stack>
)

const ContentWrapper = ({ noTitle, children }: { noTitle?: boolean; children: ReactElement | ReactElement[] }) => (
  <Box sx={{ maxHeight: noTitle ? '' : '550px', overflowY: 'auto', px: 2, pb: 2 }}>{children}</Box>
)

export const TxDetails = ({ safeTxData, txData, showHashes, noTitle }: TxDetailsProps) => {
  const [expandHashes, setExpandHashes] = useState(showHashes)
  const safeTxHash = useSafeTxHash({ safeTxData })
  const domainHash = useDomainHash()
  const messageHash = useMessageHash({ safeTxData })

  const toInfo = txData?.addressInfoIndex?.[safeTxData.to] || txData?.to
  const toName = toInfo?.name || (toInfo && 'displayName' in toInfo ? String(toInfo.displayName || '') : undefined)
  const toLogo = toInfo?.logoUri

  return (
    <PaperViewToggle>
      {[
        {
          title: noTitle ? (
            ''
          ) : (
            <Typography color="primary.light" fontWeight="bold">
              Transaction details
            </Typography>
          ),
          icon: <TableRowsRoundedIcon />,
          content: (
            <ContentWrapper noTitle={noTitle}>
              <Divider sx={{ mb: 1 }} />

              <Stack spacing={1} divider={<Divider />}>
                <TxDetailsRow label="To">
                  {toName || toLogo ? (
                    <Chip
                      sx={{ backgroundColor: 'background.paper', height: 'unset', '& > *': { p: 0.5 } }}
                      label={
                        <EthHashInfo
                          address={safeTxData.to}
                          name={toName}
                          customAvatar={toLogo}
                          showAvatar={!!toLogo}
                          avatarSize={20}
                          onlyName
                        />
                      }
                    ></Chip>
                  ) : null}

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
                </TxDetailsRow>

                <TxDetailsRow label="Value">{safeTxData.value}</TxDetailsRow>

                <TxDetailsRow label="Data" direction={safeTxData.data === '0x' ? 'row' : 'column'}>
                  <Typography variant="body2">
                    <HexEncodedData hexData={safeTxData.data} limit={66} />
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="Operation">
                  {safeTxData.operation} (
                  {(Number(safeTxData.operation) as Operation) === Operation.CALL ? 'call' : 'delegate call'})
                </TxDetailsRow>

                <TxDetailsRow label="SafeTxGas">{safeTxData.safeTxGas}</TxDetailsRow>

                <TxDetailsRow label="BaseGas">{safeTxData.baseGas}</TxDetailsRow>

                <TxDetailsRow label="GasPrice">{safeTxData.gasPrice}</TxDetailsRow>

                <TxDetailsRow label="GasToken">
                  <Typography variant="body2">
                    <EthHashInfo
                      address={safeTxData.gasToken}
                      avatarSize={20}
                      showPrefix={false}
                      showName={false}
                      hasExplorer
                    />
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="RefundReceiver">
                  <Typography variant="body2">
                    <EthHashInfo
                      address={safeTxData.refundReceiver}
                      avatarSize={20}
                      showPrefix={false}
                      showName={false}
                      hasExplorer
                    />
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="Nonce">{safeTxData.nonce}</TxDetailsRow>

                <Button onClick={() => setExpandHashes(!expandHashes)} sx={{ all: 'unset' }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    display="inline-flex"
                    alignItems="center"
                    color="primary.light"
                    sx={{ cursor: 'pointer' }}
                  >
                    Transaction hashes{' '}
                    <ExpandMoreIcon sx={expandHashes ? { transform: 'rotate(180deg)' } : undefined} />
                  </Typography>
                </Button>

                {expandHashes && domainHash && (
                  <TxDetailsRow label="Domain hash">
                    <Typography variant="body2" width="100%" sx={{ wordWrap: 'break-word' }}>
                      <HexEncodedData hexData={domainHash} limit={66} highlightFirstBytes={false} />
                    </Typography>
                  </TxDetailsRow>
                )}

                {expandHashes && messageHash && (
                  <TxDetailsRow label="Message hash">
                    <Typography variant="body2" width="100%" sx={{ wordWrap: 'break-word' }}>
                      <HexEncodedData hexData={messageHash} limit={66} highlightFirstBytes={false} />
                    </Typography>
                  </TxDetailsRow>
                )}

                {expandHashes && safeTxHash && (
                  <TxDetailsRow label="safeTxHash">
                    <Typography variant="body2" width="100%" sx={{ wordWrap: 'break-word' }}>
                      <HexEncodedData hexData={safeTxHash} limit={66} highlightFirstBytes={false} />
                    </Typography>
                  </TxDetailsRow>
                )}
              </Stack>
            </ContentWrapper>
          ),
        },
        {
          title: noTitle ? (
            ''
          ) : (
            <Typography color="primary.light" fontWeight="bold">
              Transaction details
            </Typography>
          ),
          icon: <DataObjectIcon />,
          tooltip: 'View .json/raw data',
          content: (
            <ContentWrapper>
              <Divider sx={{ mb: 1 }} />

              <TxDetailsRow label="Message" direction="column">
                <Typography variant="body2" sx={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(safeTxData, null, 2)}
                </Typography>
              </TxDetailsRow>
            </ContentWrapper>
          ),
        },
      ]}
    </PaperViewToggle>
  )
}
