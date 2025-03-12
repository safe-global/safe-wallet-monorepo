import { Box, Divider, Stack, StackProps, Typography } from '@mui/material'
import { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { PaperViewToggle } from '../../common/PaperViewToggle'
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded'
import DataObjectIcon from '@mui/icons-material/DataObject'
import EthHashInfo from '@/components/common/EthHashInfo'
import { ReactElement } from 'react'
import { isNumber, isString } from 'lodash'
import type { TransactionData } from '@safe-global/safe-gateway-typescript-sdk/dist/types/transactions'

type TxDetailsProps = {
  safeTx: SafeTransaction
  txData?: TransactionData
}

const TxDetailsRow = ({
  label,
  children,
  direction = 'row',
}: {
  label: string
  children: string | number | ReactElement
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

export const TxDetails = ({ safeTx, txData }: TxDetailsProps) => {
  const ContentWrapper = ({ children }: { children: ReactElement | ReactElement[] }) => (
    <Box sx={{ maxHeight: '500px', overflowY: 'scroll' }}>{children}</Box>
  )

  return (
    <PaperViewToggle>
      {[
        {
          title: (
            <Typography color="primary.light" fontWeight="bold">
              Transaction details
            </Typography>
          ),
          icon: <TableRowsRoundedIcon />,
          content: (
            <ContentWrapper>
              <Divider sx={{ mb: 1 }} />

              <Stack spacing={1} divider={<Divider />}>
                <TxDetailsRow label="Primary type">SafeTx</TxDetailsRow>

                <TxDetailsRow label="To">
                  <Typography variant="body2" width="100%" sx={{ '& *': { whiteSpace: 'normal', wordWrap: "break-word", alignItems: 'flex-start !important' } }}>
                    <EthHashInfo
                      address={safeTx.data.to}
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

                <TxDetailsRow label="Value">{safeTx.data.value}</TxDetailsRow>

                <TxDetailsRow label="Data" direction={safeTx.data.data === '0x' ? 'row' : 'column'}>
                  <Typography variant="body2" sx={{ wordWrap: 'break-word' }}>
                    {safeTx.data.data}
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="Operation">{safeTx.data.operation}</TxDetailsRow>

                <TxDetailsRow label="SafeTxGas">{safeTx.data.safeTxGas}</TxDetailsRow>

                <TxDetailsRow label="BaseGas">{safeTx.data.baseGas}</TxDetailsRow>

                <TxDetailsRow label="GasPrice">{safeTx.data.gasPrice}</TxDetailsRow>

                <TxDetailsRow label="GasToken">
                  <Typography variant="body2">
                    <EthHashInfo
                      address={safeTx.data.gasToken}
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
                      address={safeTx.data.refundReceiver}
                      avatarSize={20}
                      showPrefix={false}
                      showName={false}
                      hasExplorer
                    />
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="Nonce">{safeTx.data.nonce}</TxDetailsRow>
              </Stack>
            </ContentWrapper>
          ),
        },
        {
          title: (
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
                  {JSON.stringify(safeTx.data, null, 2)}
                </Typography>
              </TxDetailsRow>
            </ContentWrapper>
          ),
        },
      ]}
    </PaperViewToggle>
  )
}
