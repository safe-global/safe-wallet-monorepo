import type { ReactElement, ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Typography } from '@/components/ui/typography'
import { Code as CodeIcon } from 'lucide-react'
import classNames from 'classnames'
import { formatDateTime } from '@safe-global/utils/utils/date'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import { DataRow as TxDataRow } from '@/components/common/Table/DataRow'
import txDetailsCss from '@/components/transactions/TxDetails/styles.module.css'
import singleTxDecodedCss from '@/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded/styles.module.css'
import infoDetailsCss from '@/components/transactions/InfoDetails/styles.module.css'

type ErrorBoundarySlotProps = {
  fallback: ReactNode
  children: ReactNode
}

export type MsgDetailsViewProps = {
  shareLink: ReactNode
  proposerInfo?: ReactNode
  verifyingContractInfo?: ReactNode
  copyMessageButton: ReactNode
  decodedMsg: ReactNode
  renderErrorBoundary: (props: ErrorBoundarySlotProps) => ReactNode
  creationTimestamp: number
  modifiedTimestamp: number
  messageHashValue: ReactNode
  safeMessageValue?: ReactNode
  preparedSignatureValue?: ReactNode
  defaultOpenSignatures: string[]
  confirmations: { signature: string; ownerInfo: ReactNode; signatureInfo: ReactNode }[]
  auditLog: ReactNode
  signButton?: ReactNode
}

export function MsgDetailsView({
  shareLink,
  proposerInfo,
  verifyingContractInfo,
  copyMessageButton,
  decodedMsg,
  renderErrorBoundary,
  creationTimestamp,
  modifiedTimestamp,
  messageHashValue,
  safeMessageValue,
  preparedSignatureValue,
  defaultOpenSignatures,
  confirmations,
  auditLog,
  signButton,
}: MsgDetailsViewProps): ReactElement {
  return (
    <div className={txDetailsCss.container}>
      <div className={txDetailsCss.details}>
        <div className={txDetailsCss.shareLink}>{shareLink}</div>
        {proposerInfo && (
          <div className={txDetailsCss.txData}>
            <InfoDetails title="Created by:">{proposerInfo}</InfoDetails>
          </div>
        )}

        {verifyingContractInfo && (
          <div className={txDetailsCss.txData}>
            <InfoDetails title="Verifying contract:">{verifyingContractInfo}</InfoDetails>
          </div>
        )}

        <div className={txDetailsCss.txData}>
          <InfoDetails title={<>Message {copyMessageButton}</>}>
            {renderErrorBoundary({ fallback: <div>Error decoding message</div>, children: decodedMsg })}
          </InfoDetails>
        </div>

        <div className={txDetailsCss.txSummary}>
          <TxDataRow title="Created">{formatDateTime(creationTimestamp)}</TxDataRow>
          <TxDataRow title="Last modified">{formatDateTime(modifiedTimestamp)}</TxDataRow>
          <TxDataRow title="Message hash">{messageHashValue}</TxDataRow>
          {safeMessageValue && <TxDataRow title="SafeMessage">{safeMessageValue}</TxDataRow>}
        </div>

        {preparedSignatureValue && (
          <div className={classNames(txDetailsCss.txSummary, txDetailsCss.multiSend)}>
            <TxDataRow title="Prepared signature:">{preparedSignatureValue}</TxDataRow>
          </div>
        )}

        <div className={classNames(txDetailsCss.multiSend, 'border-t border-border')}>
          <Accordion multiple defaultValue={defaultOpenSignatures}>
            {confirmations.map((confirmation, i) => (
              <AccordionItem value={confirmation.signature} key={confirmation.signature}>
                <AccordionTrigger
                  className={classNames('flex min-h-12 items-center px-4 py-3', singleTxDecodedCss.elevationTrigger)}
                >
                  <div className={singleTxDecodedCss.summary}>
                    <CodeIcon className="size-4 shrink-0 text-muted-foreground" />
                    <Typography className={singleTxDecodedCss.summaryLabel}>
                      <b>{`Confirmation ${i + 1}`}</b>
                    </Typography>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="p-4">
                  <div className={infoDetailsCss.container}>{confirmation.ownerInfo}</div>
                  <TxDataRow title="Signature:">{confirmation.signatureInfo}</TxDataRow>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      <div className={txDetailsCss.txSigners}>
        {auditLog}
        {signButton && <div className="mt-4 flex items-center justify-center gap-2">{signButton}</div>}
      </div>
    </div>
  )
}
