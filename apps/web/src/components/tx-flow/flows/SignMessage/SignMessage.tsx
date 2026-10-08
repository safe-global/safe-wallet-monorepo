import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { useContext, useEffect } from 'react'
import type { ReactElement } from 'react'
import type { RequestId } from '@safe-global/safe-apps-sdk'
import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'

import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeMessage from '@/hooks/messages/useSafeMessage'
import useOnboard, { switchWallet } from '@/hooks/wallets/useOnboard'
import { TxModalContext } from '@/components/tx-flow'
import CopyButton from '@/components/common/CopyButton'
import MsgSigners from '@/components/safe-messages/MsgSigners'
import useDecodedSafeMessage from '@/hooks/messages/useDecodedSafeMessage'
import useSyncSafeMessageSigner from '@/hooks/messages/useSyncSafeMessageSigner'
import useHighlightHiddenTab from '@/hooks/useHighlightHiddenTab'
import { DecodedMsg } from '@/components/safe-messages/DecodedMsg'
import { dispatchPreparedSignature } from '@/services/safe-messages/safeMsgNotifications'
import { trackEvent } from '@/services/analytics'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'
import { SafeTxContext } from '../../SafeTxProvider'
import RiskConfirmationError from '@/components/tx/shared/errors/RiskConfirmationError'
import { isBlindSigningPayload, isEIP712TypedData } from '@safe-global/utils/utils/safe-messages'
import ApprovalEditor from '@/components/tx/ApprovalEditor'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import { isWalletRejection } from '@/utils/wallets'
import { getCgwErrorInfo } from '@/utils/cgw-errors'
import { getLedgerDeviceError, getLedgerUserMessage } from '@/services/onboard/ledger-errors'
import { useAppSelector } from '@/store'
import { selectBlindSigning } from '@/store/settingsSlice'
import { AppRoutes } from '@/config/routes'
import MsgShareLink from '@/components/safe-messages/MsgShareLink'
import CheckWallet from '@/components/common/CheckWallet'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { getDomainHash, getSafeMessageMessageHash } from '@safe-global/utils/utils/safe-hashes'
import type { SafeVersion } from '@safe-global/types-kit'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { RiskConfirmation } from '../../features/RiskConfirmation'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import {
  AlreadySignedByOwnerMessageView,
  BlindSigningWarningView,
  MessageDialogErrorView,
  SignMessageView,
} from '@views/components/tx-flow/flows/SignMessage/SignMessageView'

const createSkeletonMessage = (confirmationsRequired: number): MessageItem => {
  return {
    confirmations: [],
    confirmationsRequired,
    confirmationsSubmitted: 0,
    creationTimestamp: 0,
    message: '',
    logoUri: null,
    messageHash: '',
    modifiedTimestamp: 0,
    name: null,
    proposedBy: {
      value: '',
    },
    preparedSignature: null,
    origin: null,
    safeAppInfo: null,
    safeAppId: null,
    status: 'NEEDS_CONFIRMATION',
    type: 'MESSAGE',
  }
}

// The single place a message-signing failure is rendered: the toast for the
// same failure was dropped so it is shown once, next to the CTA (WA-3502).
const MessageDialogError = ({ isOwner, submitError }: { isOwner: boolean; submitError: Error | undefined }) => {
  const wallet = useWallet()
  const onboard = useOnboard()

  if (!wallet || !onboard) {
    return <MessageDialogErrorView state={{ kind: 'noWallet' }} />
  }

  if (!isOwner) {
    return <MessageDialogErrorView state={{ kind: 'notOwner' }} />
  }

  if (!submitError) {
    return null
  }

  if (isWalletRejection(submitError)) {
    return <MessageDialogErrorView state={{ kind: 'rejected' }} />
  }

  // A Ledger device failure states its own reason; its raw error is a dump of
  // DMK class names, ethers codes and the viem version (WA-3243).
  const ledgerError = getLedgerDeviceError(submitError)
  if (ledgerError) {
    return (
      <MessageDialogErrorView
        state={{ kind: 'ledger', error: submitError, message: getLedgerUserMessage(ledgerError) }}
      />
    )
  }

  // A known CGW response state replaces the copy and gets a code-only support
  // reference — never the response body, which can be an HTML page (WA-3252).
  const cgwError = getCgwErrorInfo(submitError)

  return <MessageDialogErrorView state={{ kind: 'submit', error: submitError, cgw: cgwError }} />
}

const AlreadySignedByOwnerMessage = ({ hasSigned }: { hasSigned: boolean }) => {
  const onboard = useOnboard()

  const handleSwitchWallet = () => {
    if (onboard) {
      switchWallet(onboard)
    }
  }
  if (!hasSigned) {
    return null
  }
  return <AlreadySignedByOwnerMessageView onSwitchWallet={handleSwitchWallet} />
}

const BlindSigningWarning = ({
  isBlindSigningEnabled,
  isBlindSigningPayload,
}: {
  isBlindSigningEnabled: boolean
  isBlindSigningPayload: boolean
}) => {
  const safeLinkQuery = useSafeLinkQuery()
  const query = safeLinkQuery.safe ? safeLinkQuery : undefined

  if (!isBlindSigningPayload) {
    return null
  }

  return (
    <BlindSigningWarningView
      isBlindSigningEnabled={isBlindSigningEnabled}
      href={{ pathname: AppRoutes.settings.security, query }}
    />
  )
}

type BaseProps = Pick<MessageItem, 'logoUri' | 'name' | 'message'>

export type SignMessageProps = BaseProps & {
  origin?: string
  requestId?: RequestId
}

const SignMessage = ({ message, origin, requestId }: SignMessageProps): ReactElement => {
  // Hooks & variables
  const { setTxFlow } = useContext(TxModalContext)
  const { setSafeMessage: setContextSafeMessage, setSafeMessageHash: setContextSafeMessageHash } =
    useContext(SafeTxContext)
  const { needsRiskConfirmation, isRiskConfirmed } = useSafeShield()
  const { safe } = useSafeInfo()
  const isOwner = useIsSafeOwner()
  const wallet = useWallet()
  useHighlightHiddenTab()

  const { decodedMessage, safeMessageMessage, safeMessageHash } = useDecodedSafeMessage(message, safe)

  const [safeMessage, setSafeMessage] = useSafeMessage(safeMessageHash)
  const domainHash = getDomainHash({
    chainId: safe.chainId,
    safeAddress: safe.address.value,
    safeVersion: safe.version as SafeVersion,
  })
  const messageHash = getSafeMessageMessageHash({ message: decodedMessage, safeVersion: safe.version as SafeVersion })
  const isPlainTextMessage = typeof decodedMessage === 'string'
  const decodedMessageAsString = isPlainTextMessage ? decodedMessage : JSON.stringify(decodedMessage, null, 2)
  const signedByCurrentSafe = !!safeMessage?.confirmations.some(({ owner }) => owner.value === wallet?.address)
  const hasSignature = safeMessage?.confirmations && safeMessage.confirmations.length > 0
  const isFullySigned = !!safeMessage?.preparedSignature
  const isEip712 = isEIP712TypedData(decodedMessage)
  const isBlindSigningRequest = isBlindSigningPayload(decodedMessage)
  const isBlindSigningEnabled = useAppSelector(selectBlindSigning)
  const isDisabled =
    !isOwner ||
    signedByCurrentSafe ||
    !safe.deployed ||
    (!isBlindSigningEnabled && isBlindSigningRequest) ||
    (needsRiskConfirmation && !isRiskConfirmed)

  const { onSign, submitError } = useSyncSafeMessageSigner(
    safeMessage,
    decodedMessage,
    safeMessageHash,
    requestId,
    origin,
    () => setTxFlow(undefined),
  )

  const handleSign = async () => {
    const updatedMessage = await onSign()

    if (updatedMessage) {
      setSafeMessage(updatedMessage)
    }

    // Track first signature as creation
    const isCreation = updatedMessage?.confirmations.length === 1
    trackEvent({ ...(isCreation ? TX_EVENTS.CREATE : TX_EVENTS.CONFIRM), label: TX_TYPES.typed_message })
  }

  const onContinue = async () => {
    if (!safeMessage) {
      return
    }
    await dispatchPreparedSignature(safeMessage, safeMessageHash, () => setTxFlow(undefined), requestId)
  }

  // Set message for Safe Shield threat analysis
  useEffect(() => {
    if (isEip712) {
      setContextSafeMessage(decodedMessage)
      setContextSafeMessageHash(safeMessageHash as `0x${string}`)
    } else {
      setContextSafeMessage(undefined)
      setContextSafeMessageHash(undefined)
    }
  }, [decodedMessage, isEip712, setContextSafeMessage, setContextSafeMessageHash, safeMessageHash])

  return (
    <SignMessageView
      threshold={safe.threshold}
      isEip712={isEip712}
      renderApprovalEditor={(fallback) => (
        <ObservabilityErrorBoundary fallback={fallback}>
          <ApprovalEditor safeMessage={isEIP712TypedData(decodedMessage) ? decodedMessage : undefined} />
        </ObservabilityErrorBoundary>
      )}
      blindSigningWarning={
        <BlindSigningWarning
          isBlindSigningEnabled={isBlindSigningEnabled}
          isBlindSigningPayload={isBlindSigningRequest}
        />
      }
      copyButton={<CopyButton text={decodedMessageAsString} />}
      decodedMessage={<DecodedMsg message={decodedMessage} isInModal />}
      hashes={{ safeMessage: safeMessageMessage, safeMessageHash, domainHash, messageHash }}
      renderAddress={(props) => <EthHashInfo {...props} />}
      riskConfirmation={<RiskConfirmation />}
      isFullySigned={isFullySigned}
      canContinue={!!safeMessage?.preparedSignature}
      onContinue={onContinue}
      renderMsgSigners={(props) => <MsgSigners msg={safeMessage ?? createSkeletonMessage(safe.threshold)} {...props} />}
      alreadySignedMessage={<AlreadySignedByOwnerMessage hasSigned={signedByCurrentSafe} />}
      hasRequestId={!!requestId}
      hasSignature={!!hasSignature}
      shareLink={<MsgShareLink safeMessageHash={safeMessageHash} button />}
      networkWarning={<NetworkWarning />}
      dialogError={<MessageDialogError isOwner={isOwner} submitError={submitError} />}
      riskConfirmationError={<RiskConfirmationError />}
      isDeployed={safe.deployed}
      renderCheckWallet={(render) => <CheckWallet checkNetwork={!isDisabled}>{render}</CheckWallet>}
      onSign={handleSign}
      isDisabled={isDisabled}
    />
  )
}

export default SignMessage
