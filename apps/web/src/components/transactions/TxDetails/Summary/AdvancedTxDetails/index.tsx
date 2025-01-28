import type { ReactElement } from 'react'
import React, { useState } from 'react'
import { Link, Box, Stack, Paper, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { generateDataRowValue } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isCustomTxInfo, isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { Operation } from '@safe-global/safe-gateway-typescript-sdk'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import DecodedData from '../../TxData/DecodedData'
import { View, ViewToggleButtonGroup } from './ViewToggleButtonGroup'
import CopyButton from '@/components/common/CopyButton'
import { AdvancedDetailsDataRow } from './AdvancedDetailsDataRow'
import EthHashInfo from '@/components/common/EthHashInfo'

interface AdvancedTxDetailsProps {
  txDetails: TransactionDetails
  defaultExpanded?: boolean
  defaultView?: View
  hideDecodedData?: boolean
}

export const AdvancedTxDetails = ({
  txDetails,
  defaultExpanded = false,
  defaultView = View.Decoded,
  hideDecodedData = false,
}: AdvancedTxDetailsProps): ReactElement | undefined => {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded)
  const [view, setView] = useState<View>(defaultView)

  const toggleExpanded = () => {
    setExpanded((val) => !val)
  }

  const changeView = (newView: View) => {
    if (newView) {
      setView(newView)
    }
  }

  const { detailedExecutionInfo, txData } = txDetails

  let confirmations, baseGas, gasPrice, gasToken, refundReceiver, safeTxGas
  if (isMultisigDetailedExecutionInfo(detailedExecutionInfo)) {
    ;({ confirmations, baseGas, gasPrice, gasToken, safeTxGas } = detailedExecutionInfo)
    refundReceiver = detailedExecutionInfo.refundReceiver?.value
  }

  const isCustom = isCustomTxInfo(txDetails.txInfo)

  console.log('txDetails', txDetails)
  console.log('txData', txData)

  return (
    txData && (
      <>
        {!defaultExpanded && (
          <Link
            data-testid="tx-advanced-details"
            fontWeight="bold"
            onClick={toggleExpanded}
            component="button"
            variant="body1"
            display="flex"
            alignItems="center"
            sx={{ textDecoration: 'none' }}
          >
            <span>Advanced details</span>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Link>
        )}

        {expanded && (
          <Stack gap={1}>
            {!isCustom && !hideDecodedData && (
              <Box borderBottom="1px solid" borderColor="border.light" p={2} mt={1} mb={2} mx={-2}>
                <DecodedData txData={txDetails.txData} toInfo={txDetails.txData?.to} />
              </Box>
            )}

            <Paper sx={{ backgroundColor: 'background.main', padding: 2 }}>
              <Stack spacing={0.5}>
                <Grid container spacing={0.5}>
                  <Grid color="primary.light" size={3} hidden={view === View.Raw}>
                    Name
                  </Grid>
                  <Grid color="primary.light" size={view === View.Raw ? 12 : 9}>
                    <Stack direction="row" justifyContent="space-between">
                      <Stack direction="row" spacing={0.5}>
                        <Typography variant="body1">Data</Typography>
                        {txData.hexData && view === View.Raw && <CopyButton text={txData.hexData} />}
                      </Stack>
                      <ViewToggleButtonGroup value={view} onChange={changeView} />
                    </Stack>
                  </Grid>
                </Grid>

                {view === View.Decoded && (
                  <>
                    <AdvancedDetailsDataRow datatestid="tx-operation" title="Operation">
                      {`${txData.operation} (${Operation[txData.operation].toLowerCase()})`}
                    </AdvancedDetailsDataRow>

                    <AdvancedDetailsDataRow datatestid="tx-safe-gas" title="safeTxGas">
                      {safeTxGas}
                    </AdvancedDetailsDataRow>

                    <AdvancedDetailsDataRow datatestid="tx-bas-gas" title="baseGas">
                      {baseGas}
                    </AdvancedDetailsDataRow>

                    <AdvancedDetailsDataRow datatestid="tx-gas-price" title="gasPrice">
                      {gasPrice}
                    </AdvancedDetailsDataRow>

                    {gasToken && (
                      <AdvancedDetailsDataRow datatestid="tx-gas-token" title="gasToken">
                        <EthHashInfo address={gasToken} avatarSize={24} hasExplorer showCopyButton />
                      </AdvancedDetailsDataRow>
                    )}

                    {refundReceiver && (
                      <AdvancedDetailsDataRow datatestid="tx-refund-receiver" title="refundReceiver">
                        <EthHashInfo address={refundReceiver} avatarSize={24} hasExplorer showCopyButton />
                      </AdvancedDetailsDataRow>
                    )}

                    {confirmations?.map(({ signature }, index) => (
                      <AdvancedDetailsDataRow
                        datatestid="tx-signature"
                        title={`Signature ${index + 1}`}
                        key={`signature-${index}:`}
                      >
                        {generateDataRowValue(signature, 'rawData')}
                      </AdvancedDetailsDataRow>
                    ))}

                    <AdvancedDetailsDataRow datatestid="tx-raw-data" title="Raw data">
                      {generateDataRowValue(txData.hexData, 'rawData')}
                    </AdvancedDetailsDataRow>
                  </>
                )}

                {view === View.Raw && txData.hexData && (
                  <Typography
                    variant="body2"
                    color="primary.light"
                    fontFamily="monospace"
                    sx={{
                      overflowWrap: 'break-word',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 5,
                      lineClamp: 5,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {txData.hexData}
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Stack>
        )}
      </>
    )
  )
}
