import type { ReactElement, ReactNode } from 'react'
import { DataRow as TxDataRow } from '@/components/common/Table/DataRow'
import { dateString } from '@safe-global/utils/utils/formatters'
import { Separator } from '@/components/ui/separator'
import DecoderLinks from './DecoderLinks'

export type SummaryViewProps = {
  multisend?: ReactNode
  showAuditLogFields: boolean
  submittedAt?: number
  executedAt?: number | null
  txHash?: string | null
  txHashValue: ReactNode
  historyFees?: ReactNode
  showDetails: boolean
  renderAccordion: (children: ReactNode) => ReactNode
  showDecodedData: boolean
  decodedData: ReactNode
  receipt: ReactNode
}

export const SummaryView = ({
  multisend,
  showAuditLogFields,
  submittedAt,
  executedAt,
  txHash,
  txHashValue,
  historyFees,
  showDetails,
  renderAccordion,
  showDecodedData,
  decodedData,
  receipt,
}: SummaryViewProps): ReactElement => {
  return (
    <>
      {multisend}

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

      {showAuditLogFields && txHash && (
        <TxDataRow datatestid="tx-hash" title="Transaction hash">
          {txHashValue}{' '}
        </TxDataRow>
      )}

      {historyFees}

      {showDetails && (
        <div className="mt-4">
          {renderAccordion(
            <div className="flex flex-col gap-2">
              {showDecodedData && (
                <>
                  {decodedData}
                  <Separator bleed="4" className="my-2" />
                </>
              )}

              <div>
                <DecoderLinks />

                {receipt}
              </div>
            </div>,
          )}
        </div>
      )}
    </>
  )
}
