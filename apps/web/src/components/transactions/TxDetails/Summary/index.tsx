import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { memo, type ReactElement } from 'react'
import { TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isCustomTxInfo, isMultiSendTxInfo, isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import type { SafeTransactionData } from '@safe-global/types-kit'
import { dateString } from '@safe-global/utils/utils/formatters'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { Receipt } from '@/components/tx/ConfirmTxDetails/Receipt'
import DecodedData from '../TxData/DecodedData'
import ColorCodedTxAccordion from '@/components/tx/ColorCodedTxAccordion'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import DecoderLinks from './DecoderLinks'
import isEqual from 'lodash/isEqual'
import Multisend from '../TxData/DecodedData/Multisend'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'

interface Props {
  safeTxData?: SafeTransactionData
  txData: TransactionDetails['txData']
  txInfo?: TransactionDetails['txInfo']
  txDetails?: TransactionDetails
  showMultisend?: boolean
  showDecodedData?: boolean
  showAuditLogFields?: boolean
}

const Summary = ({
  safeTxData,
  txData,
  txInfo,
  txDetails,
  showMultisend = true,
  showDecodedData = true,
  showAuditLogFields = true,
}: Props): ReactElement => {
  const { executedAt } = txDetails ?? {}
  const customTxInfo = txInfo && isCustomTxInfo(txInfo) ? txInfo : undefined
  const toInfo = customTxInfo?.to || txData?.addressInfoIndex?.[txData?.to.value] || txData?.to
  const showDetails = Boolean(txInfo && txData)

  let baseGas, gasPrice, gasToken, safeTxGas, refundReceiver, submittedAt, nonce
  if (txDetails && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    ;({ baseGas, gasPrice, gasToken, safeTxGas, submittedAt, nonce } = txDetails.detailedExecutionInfo)
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

  const isMultisend = (txInfo !== undefined && isMultiSendTxInfo(txInfo)) || isMultiSendCalldata(safeTxData.data)
  const transactionData = txData ?? txDetails?.txData

  return (
    <>
      {showMultisend && isMultisend && (
        <Multisend txData={transactionData} isExecuted={!!txDetails?.executedAt} compact />
      )}

      {showAuditLogFields && submittedAt && (
        <TxDataRow datatestid="tx-created-at" title="Created">
          <div className="text-sm">{dateString(submittedAt)}</div>
        </TxDataRow>
      )}

      {showAuditLogFields && executedAt && (
        <TxDataRow datatestid="tx-executed-at" title="Executed">
          <div className="text-sm">{dateString(executedAt)}</div>
        </TxDataRow>
      )}

      {showDetails && (
        <div className="mt-4">
          <ColorCodedTxAccordion txInfo={txInfo} txData={txData}>
            <div className="flex flex-col gap-2">
              {showDecodedData && (
                <>
                  <DecodedData txData={txData} toInfo={toInfo} />
                  <Separator className="-mx-4 my-2 w-[calc(100%+32px)]" />
                </>
              )}

              <div>
                <Typography variant="paragraph-small-bold" className="mb-4 block">
                  Advanced details
                </Typography>

                <DecoderLinks />

                <Receipt
                  safeTxData={safeTxData}
                  txData={txData}
                  txDetails={txDetails}
                  txInfo={txInfo}
                  withSignatures
                  grid
                />
              </div>
            </div>
          </ColorCodedTxAccordion>
        </div>
      )}
    </>
  )
}

export default memo(Summary, isEqual)
