import type { ReactElement } from 'react'
import React from 'react'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isCustomTxInfo, isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransactionData } from '@safe-global/safe-core-sdk-types'
import { dateString } from '@safe-global/utils/utils/formatters'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { TxDetails } from '@/components/tx/ConfirmTxDetails/TxDetails'
import DecodedData from '../TxData/DecodedData'
import { AccordionDetails, AccordionSummary, Box } from '@mui/material'
import HelpTooltip from '@/components/tx/ColorCodedTxAccodion/HelpTooltip'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import accordionCss from '@/styles/accordion.module.css'
import ColorCodedTxAccodion from '@/components/tx/ColorCodedTxAccodion'
import { BackgroundAccordion } from './BackgroundAccordion'

interface Props {
  safeTxData?: SafeTransactionData
  txData: TransactionDetails['txData']
  txInfo?: TransactionDetails['txInfo']
  txDetails?: TransactionDetails
}

const Summary = ({ safeTxData, txData, txInfo, txDetails }: Props): ReactElement => {
  const { txHash, executedAt } = txDetails ?? {}
  const toInfo = txData?.addressInfoIndex?.[txData?.to.value] || txData?.to
  const isExpanded = txInfo && isCustomTxInfo(txInfo)

  let baseGas, gasPrice, gasToken, safeTxGas, refundReceiver, submittedAt, nonce
  if (txDetails && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    ;({ baseGas, gasPrice, gasToken, safeTxGas, nonce } = txDetails.detailedExecutionInfo)
    refundReceiver = txDetails.detailedExecutionInfo.refundReceiver?.value
  }

  safeTxData = safeTxData ?? {
    to: txData?.to.value ?? ZERO_ADDRESS,
    data: txData?.hexData ?? '0x',
    value: txData?.value ?? BigInt(0).toString(),
    operation: (txData?.operation as number) ?? 0,
    baseGas: baseGas ?? BigInt(0).toString(),
    gasPrice: gasPrice ?? BigInt(0).toString(),
    gasToken: gasToken ?? ZERO_ADDRESS,
    nonce: nonce ?? 0,
    refundReceiver: refundReceiver ?? ZERO_ADDRESS,
    safeTxGas: safeTxGas ?? BigInt(0).toString(),
  }

  return (
    <>
      {txHash && (
        <TxDataRow datatestid="tx-hash" title="Transaction hash:">
          {generateDataRowValue(txHash, 'hash', true)}{' '}
        </TxDataRow>
      )}

      <TxDataRow datatestid="tx-created-at" title="Created:">
        {submittedAt ? dateString(submittedAt) : null}
      </TxDataRow>

      {executedAt && (
        <TxDataRow datatestid="tx-executed-at" title="Executed:">
          {dateString(executedAt)}
        </TxDataRow>
      )}

      <ColorCodedTxAccodion txInfo={txInfo} txData={txData} defaultExpanded={isExpanded}>
        <DecodedData txData={txData} toInfo={toInfo} />

        <Box my={3} />

        <BackgroundAccordion elevation={0} defaultExpanded={false}>
          <AccordionSummary
            data-testid="decoded-tx-summary"
            expandIcon={<ExpandMoreIcon />}
            className={accordionCss.accordion}
          >
            Advanced details
            <HelpTooltip />
          </AccordionSummary>

          <AccordionDetails data-testid="decoded-tx-details">
            <Box my={-4}>
              <TxDetails safeTxData={safeTxData} txData={txData} showHashes noTitle />
            </Box>
          </AccordionDetails>
        </BackgroundAccordion>
      </ColorCodedTxAccodion>
    </>
  )
}

export default Summary
