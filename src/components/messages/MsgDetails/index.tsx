import { Accordion, AccordionSummary, Typography, AccordionDetails, Box } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CodeIcon from '@mui/icons-material/Code'
import classNames from 'classnames'
import type { ReactElement } from 'react'

import { formatDateTime } from '@/utils/date'
import EthHashInfo from '@/components/common/EthHashInfo'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import MsgSigners from '@/components/messages/MsgSigners'
import useWallet from '@/hooks/wallets/useWallet'
import SignMsgButton from '@/components/messages/SignMsgButton'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { MessageStatus } from '@/store/msgsSlice'
import Msg from '@/components/messages/Msg'
import type { Message } from '@/store/msgsSlice'

import txDetailsCss from '@/components/transactions/TxDetails/styles.module.css'
import singleTxDecodedCss from '@/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded/styles.module.css'
import infoDetailsCss from '@/components/transactions/InfoDetails/styles.module.css'

const MsgDetails = ({ msg }: { msg: Message }): ReactElement => {
  const wallet = useWallet()
  const isWrongChain = useIsWrongChain()
  const isConfirmed = msg.status === MessageStatus.CONFIRMED

  return (
    <div className={txDetailsCss.container}>
      <div className={txDetailsCss.details}>
        <div className={txDetailsCss.txData}>
          <InfoDetails title="Created by:">
            <EthHashInfo
              address={msg.proposedBy.value || ''}
              name={msg.proposedBy.name}
              customAvatar={msg.proposedBy.logoUri}
              shortAddress={false}
              showCopyButton
              hasExplorer
            />
          </InfoDetails>
        </div>

        <div className={txDetailsCss.txSummary}>
          <TxDataRow title="Message:">
            <Msg message={msg.message} />
          </TxDataRow>
          <TxDataRow title="Hash:">{generateDataRowValue(msg.messageHash, 'hash')}</TxDataRow>
          <TxDataRow title="Created:">{formatDateTime(msg.creationTimestamp)}</TxDataRow>
          <TxDataRow title="Last modified:">{formatDateTime(msg.modifiedTimestamp)}</TxDataRow>
        </div>

        {msg.preparedSignature && (
          <div className={classNames(txDetailsCss.txSummary, txDetailsCss.multiSend)}>
            <TxDataRow title="Prepared signature:">
              {generateDataRowValue(msg.preparedSignature, 'hash', true)}
            </TxDataRow>
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
                    customAvatar={confirmation.owner.logoUri}
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
        {wallet && !isWrongChain && !isConfirmed && (
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={2}>
            <SignMsgButton msg={msg} />
          </Box>
        )}
      </div>
    </div>
  )
}

export default MsgDetails
