import { type SyntheticEvent, type ReactElement, memo } from 'react'
import { ErrorBoundary } from '@sentry/react'
import { isCustomTxInfo, isNativeTokenTransfer, isTransferTxInfo } from '@/utils/transaction-guards'
import { Accordion, AccordionDetails, AccordionSummary, Box, Stack } from '@mui/material'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import Summary, { PartialSummary } from '@/components/transactions/TxDetails/Summary'
import { trackEvent, MODALS_EVENTS } from '@/services/analytics'
import Multisend from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData'
import accordionCss from '@/styles/accordion.module.css'
import HelpToolTip from './HelpTooltip'

type DecodedTxProps = {
  tx?: SafeTransaction
  txId?: string
  txDetails?: TransactionDetails
  txInfo?: TransactionDetails['txInfo']
  txData?: TransactionDetails['txData']
  showMultisend?: boolean
  showMethodCall?: boolean
  showAdvancedDetails?: boolean
}

export const Divider = () => (
  <Box
    borderBottom="1px solid var(--color-border-light)"
    width="calc(100% + 32px)"
    my={2}
    sx={{ ml: '-16px !important' }}
  />
)

const onChangeExpand = (_: SyntheticEvent, expanded: boolean) => {
  trackEvent({ ...MODALS_EVENTS.TX_DETAILS, label: expanded ? 'Open' : 'Close' })
}

const DecodedTx = ({
  tx,
  txDetails,
  txInfo,
  txData,
  showMultisend = true,
  showMethodCall = false,
  showAdvancedDetails = true,
}: DecodedTxProps): ReactElement => {
  const decodedData = txData?.dataDecoded
  const isMultisend = decodedData?.parameters && !!decodedData?.parameters[0]?.valueDecoded
  const isMethodCallInAdvanced = showAdvancedDetails && (!showMethodCall || (isMultisend && showMultisend))

  let toInfo = tx && {
    value: tx.data.to,
  }
  if (txInfo && isCustomTxInfo(txInfo)) {
    toInfo = txInfo.to
  }

  const decodedDataBlock = <DecodedData txData={txData} toInfo={toInfo} />
  const showDecodedData = isMethodCallInAdvanced && decodedData?.method

  return (
    <Stack spacing={2}>
      {!isMethodCallInAdvanced && (
        <Box border="1px solid var(--color-border-light)" borderRadius={1} p={2}>
          {decodedDataBlock}
        </Box>
      )}

      {isMultisend && showMultisend && <Multisend txData={txData} compact />}

      {showAdvancedDetails && (
        <Box>
          <Accordion elevation={0} onChange={onChangeExpand} sx={!tx ? { pointerEvents: 'none' } : undefined}>
            <AccordionSummary
              data-testid="decoded-tx-summary"
              expandIcon={<ExpandMoreIcon />}
              className={accordionCss.accordion}
            >
              Advanced details
              <HelpToolTip />
              <Box flex={1} />
              {isMethodCallInAdvanced && decodedData?.method}
              {txInfo && isTransferTxInfo(txInfo) && isNativeTokenTransfer(txInfo.transferInfo) && (
                <span>native transfer</span>
              )}
            </AccordionSummary>

            <AccordionDetails data-testid="decoded-tx-details">
              {showDecodedData && (
                <>
                  {decodedDataBlock}
                  <Divider />
                </>
              )}

              {txDetails && !showDecodedData ? (
                <Summary
                  txDetails={txDetails}
                  defaultExpanded
                  hideDecodedData={isMethodCallInAdvanced && !!decodedData?.method}
                />
              ) : (
                tx && (
                  <ErrorBoundary>
                    <PartialSummary safeTx={tx} />
                  </ErrorBoundary>
                )
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Stack>
  )
}

export default memo(DecodedTx)
