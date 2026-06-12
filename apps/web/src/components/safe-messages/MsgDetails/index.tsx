import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { useMemo, type ReactElement } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Typography } from '@/components/ui/typography'
import { Code as CodeIcon } from 'lucide-react'
import classNames from 'classnames'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'

import { formatDateTime } from '@safe-global/utils/utils/date'
import EthHashInfo from '@/components/common/EthHashInfo'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import MsgAuditLog from '@/components/safe-messages/MsgAuditLog'
import useWallet from '@/hooks/wallets/useWallet'
import SignMsgButton from '@/components/safe-messages/SignMsgButton'
import { generateSafeMessageMessage, isEIP712TypedData } from '@safe-global/utils/utils/safe-messages'

import txDetailsCss from '@/components/transactions/TxDetails/styles.module.css'
import singleTxDecodedCss from '@/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded/styles.module.css'
import infoDetailsCss from '@/components/transactions/InfoDetails/styles.module.css'
import { DecodedMsg } from '../DecodedMsg'
import CopyButton from '@/components/common/CopyButton'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import MsgShareLink from '../MsgShareLink'

const MsgDetails = ({ msg }: { msg: MessageItem }): ReactElement => {
  const wallet = useWallet()
  const isConfirmed = msg.status === 'CONFIRMED'
  const safeMessage = useMemo(() => {
    try {
      return generateSafeMessageMessage(msg.message)
    } catch (e) {
      return ''
    }
  }, [msg.message])
  const verifyingContract = isEIP712TypedData(msg.message) ? msg.message.domain.verifyingContract : undefined

  return (
    <div className={txDetailsCss.container}>
      <div className={txDetailsCss.details}>
        <div className={txDetailsCss.shareLink}>
          <MsgShareLink safeMessageHash={msg.messageHash} />
        </div>
        <div className={txDetailsCss.txData}>
          <InfoDetails title="Created by:">
            <EthHashInfo
              address={msg.proposedBy.value || ''}
              name={msg.proposedBy.name}
              customAvatar={msg.proposedBy.logoUri || undefined}
              shortAddress={false}
              showCopyButton
              hasExplorer
            />
          </InfoDetails>
        </div>

        {verifyingContract && (
          <div className={txDetailsCss.txData}>
            <InfoDetails title="Verifying contract:">
              <NamedAddressInfo address={verifyingContract} shortAddress={false} showCopyButton hasExplorer />
            </InfoDetails>
          </div>
        )}

        <div className={txDetailsCss.txData}>
          <InfoDetails
            title={
              <>
                Message <CopyButton text={JSON.stringify(msg.message, null, 2)} />
              </>
            }
          >
            <ObservabilityErrorBoundary fallback={<div>Error decoding message</div>}>
              <DecodedMsg message={msg.message} />
            </ObservabilityErrorBoundary>
          </InfoDetails>
        </div>

        <div className={txDetailsCss.txSummary}>
          <TxDataRow title="Created">{formatDateTime(msg.creationTimestamp)}</TxDataRow>
          <TxDataRow title="Last modified">{formatDateTime(msg.modifiedTimestamp)}</TxDataRow>
          <TxDataRow title="Message hash">{generateDataRowValue(msg.messageHash, 'hash')}</TxDataRow>
          {safeMessage && <TxDataRow title="SafeMessage">{generateDataRowValue(safeMessage, 'hash')}</TxDataRow>}
        </div>

        {msg.preparedSignature && (
          <div className={classNames(txDetailsCss.txSummary, txDetailsCss.multiSend)}>
            <TxDataRow title="Prepared signature:">{generateDataRowValue(msg.preparedSignature, 'hash')}</TxDataRow>
          </div>
        )}

        <div className={txDetailsCss.multiSend}>
          <Accordion
            multiple
            defaultValue={msg.confirmations
              .filter((confirmation) => confirmation.owner.value === wallet?.address)
              .map((confirmation) => confirmation.signature)}
          >
            {msg.confirmations.map((confirmation, i) => (
              <AccordionItem value={confirmation.signature} key={confirmation.signature}>
                <AccordionTrigger>
                  <div className={singleTxDecodedCss.summary}>
                    <CodeIcon className="size-5" />
                    <Typography>{`Confirmation ${i + 1}`}</Typography>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className={infoDetailsCss.container}>
                    <EthHashInfo
                      address={confirmation.owner.value || ''}
                      name={confirmation.owner.name}
                      customAvatar={confirmation.owner.logoUri || undefined}
                      shortAddress={false}
                      showCopyButton
                      hasExplorer
                    />
                  </div>
                  <TxDataRow title="Signature:">
                    <EthHashInfo address={confirmation.signature} showAvatar={false} showCopyButton />
                  </TxDataRow>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      <div className={txDetailsCss.txSigners}>
        <MsgAuditLog msg={msg} />
        {wallet && !isConfirmed && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <SignMsgButton msg={msg} />
          </div>
        )}
      </div>
    </div>
  )
}

export default MsgDetails
