import { Box, Divider, Stack, StackProps, Typography } from '@mui/material'
import { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { PaperViewToggle } from '../../common/PaperViewToggle'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded'
import EthHashInfo from '@/components/common/EthHashInfo'
import { ReactElement } from 'react'
import { isNumber, isString } from 'lodash'

type TxDetailsProps = {
  safeTx: SafeTransaction
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

export const TxDetails = ({ safeTx }: TxDetailsProps) => (
  <PaperViewToggle>
    {[
      {
        title: (
          <Typography color="text.secondary" fontWeight="bold">
            Transaction details
          </Typography>
        ),
        icon: <GridViewRoundedIcon />,
        content: (
          <>
            <Divider sx={{ mb: 1 }} />

            <Stack spacing={1} divider={<Divider />}>
              <TxDetailsRow label="Primary type">SafeTx</TxDetailsRow>

              <TxDetailsRow label="To">
                <Box>
                  <EthHashInfo address={safeTx.data.to} avatarSize={20} showPrefix={false} hasExplorer />
                </Box>
              </TxDetailsRow>

              <TxDetailsRow label="Value">{safeTx.data.value}</TxDetailsRow>

              <TxDetailsRow label="Data" direction="column">
                <Typography variant="body2" sx={{ wordWrap: 'break-word' }}>
                  {safeTx.data.data}
                </Typography>
              </TxDetailsRow>

              <TxDetailsRow label="Operation">{safeTx.data.operation}</TxDetailsRow>

              <TxDetailsRow label="SafeTxGas">{safeTx.data.safeTxGas}</TxDetailsRow>

              <TxDetailsRow label="BaseGas">{safeTx.data.baseGas}</TxDetailsRow>

              <TxDetailsRow label="GasPrice">{safeTx.data.gasPrice}</TxDetailsRow>

              <TxDetailsRow label="GasToken">
                <Box>
                  <EthHashInfo address={safeTx.data.gasToken} avatarSize={20} showPrefix={false} hasExplorer />
                </Box>
              </TxDetailsRow>

              <TxDetailsRow label="RefundReceiver">
                <Box>
                  <EthHashInfo address={safeTx.data.refundReceiver} avatarSize={20} showPrefix={false} hasExplorer />
                </Box>
              </TxDetailsRow>

              <TxDetailsRow label="Nonce">{safeTx.data.nonce}</TxDetailsRow>
            </Stack>
          </>
        ),
      },
      {
        title: (
          <Typography color="text.secondary" fontWeight="bold">
            Raw data
          </Typography>
        ),
        icon: <TableRowsRoundedIcon />,
        content: (
          <Typography variant="body2" fontFamily="monospace" sx={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {JSON.stringify(safeTx.data, null, 2)}
          </Typography>
        ),
      },
    ]}
  </PaperViewToggle>
)
