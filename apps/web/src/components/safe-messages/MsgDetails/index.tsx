import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { useMemo, type ReactElement } from 'react'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import EthHashInfo from '@/components/common/EthHashInfo'
import { generateDataRowValue } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import MsgAuditLog from '@/components/safe-messages/MsgAuditLog'
import useWallet from '@/hooks/wallets/useWallet'
import SignMsgButton from '@/components/safe-messages/SignMsgButton'
import { generateSafeMessageMessage, isEIP712TypedData } from '@safe-global/utils/utils/safe-messages'
import { DecodedMsg } from '../DecodedMsg'
import CopyButton from '@/components/common/CopyButton'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import MsgShareLink from '../MsgShareLink'
import { MsgDetailsView } from '@views/components/safe-messages/MsgDetails/MsgDetailsView'

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
    <MsgDetailsView
      shareLink={<MsgShareLink safeMessageHash={msg.messageHash} />}
      proposerInfo={
        msg.proposedBy && (
          <EthHashInfo
            address={msg.proposedBy.value}
            name={msg.proposedBy.name}
            customAvatar={msg.proposedBy.logoUri || undefined}
            shortAddress={false}
            showCopyButton
            hasExplorer
          />
        )
      }
      verifyingContractInfo={
        verifyingContract && (
          <NamedAddressInfo address={verifyingContract} shortAddress={false} showCopyButton hasExplorer />
        )
      }
      copyMessageButton={<CopyButton text={JSON.stringify(msg.message, null, 2)} />}
      decodedMsg={<DecodedMsg message={msg.message} />}
      renderErrorBoundary={(props) => <ObservabilityErrorBoundary {...props} />}
      creationTimestamp={msg.creationTimestamp}
      modifiedTimestamp={msg.modifiedTimestamp}
      messageHashValue={generateDataRowValue(msg.messageHash, 'hash')}
      safeMessageValue={safeMessage && generateDataRowValue(safeMessage, 'hash')}
      preparedSignatureValue={msg.preparedSignature && generateDataRowValue(msg.preparedSignature, 'hash')}
      defaultOpenSignatures={msg.confirmations
        .filter((confirmation) => confirmation.owner.value === wallet?.address)
        .map((confirmation) => confirmation.signature)}
      confirmations={msg.confirmations.map((confirmation) => ({
        signature: confirmation.signature,
        ownerInfo: (
          <EthHashInfo
            address={confirmation.owner.value || ''}
            name={confirmation.owner.name}
            customAvatar={confirmation.owner.logoUri || undefined}
            shortAddress={false}
            showCopyButton
            hasExplorer
          />
        ),
        signatureInfo: <EthHashInfo address={confirmation.signature} showAvatar={false} showCopyButton />,
      }))}
      auditLog={<MsgAuditLog msg={msg} />}
      signButton={wallet && !isConfirmed && <SignMsgButton msg={msg} />}
    />
  )
}

export default MsgDetails
