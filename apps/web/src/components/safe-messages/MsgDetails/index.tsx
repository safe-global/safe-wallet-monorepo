import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { useMemo, type ReactElement } from 'react'
import { Accordion, AccordionSummary, Typography, AccordionDetails, Box } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CodeIcon from '@mui/icons-material/Code'
import classNames from 'classnames'
import { ErrorBoundary } from '@sentry/react'

import { formatDateTime } from '@safe-global/utils/utils/date'
import EthHashInfo from '@/components/common/EthHashInfo'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import MsgSigners from '@/components/safe-messages/MsgSigners'
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
            <ErrorBoundary fallback={<div>Error decoding message</div>}>
              <DecodedMsg message={msg.message} />
            </ErrorBoundary>
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
          {msg.confirmations.map((confirmation, i) => (
            <Accordion
              variant="elevation"
              key={confirmation.signature}
              defaultExpanded={confirmation.owner.value === wallet?.address}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <div className={singleTxDecodedCss.summary}>
                  <CodeIcon />
                  <Typography>{`Confirmation ${i + 1}`}</Typography>
                </div>
              </AccordionSummary>

              <AccordionDetails>
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
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </div>
      <div className={txDetailsCss.txSigners}>
        <MsgSigners msg={msg} />
        {wallet && !isConfirmed && (
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={2}>
            <SignMsgButton msg={msg} />
          </Box>
        )}
      </div>
    </div>
  )
}

export default MsgDetails
