import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useContext, useEffect } from 'react'
import type { ReactElement } from 'react'
import type { RequestId } from '@safe-global/safe-apps-sdk'
import EthHashInfo from '@/components/common/EthHashInfo'
import RequiredIcon from '@/public/images/messages/required.svg'
import useSafeInfo from '@/hooks/useSafeInfo'

import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeMessage from '@/hooks/messages/useSafeMessage'
import useOnboard, { switchWallet } from '@/hooks/wallets/useOnboard'
import { TxModalContext } from '@/components/tx-flow'
import CopyButton from '@/components/common/CopyButton'
import MsgSigners from '@/components/safe-messages/MsgSigners'
import useDecodedSafeMessage from '@/hooks/messages/useDecodedSafeMessage'
import useSyncSafeMessageSigner from '@/hooks/messages/useSyncSafeMessageSigner'
import SuccessMessage from '@/components/tx/SuccessMessage'
import useHighlightHiddenTab from '@/hooks/useHighlightHiddenTab'
import InfoBox from '@/components/safe-messages/InfoBox'
import { DecodedMsg } from '@/components/safe-messages/DecodedMsg'
import TxCard from '@/components/tx-flow/common/TxCard'
import { dispatchPreparedSignature } from '@/services/safe-messages/safeMsgNotifications'
import { trackEvent } from '@/services/analytics'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'
import { SafeTxContext } from '../../SafeTxProvider'
import RiskConfirmationError from '@/components/tx/shared/errors/RiskConfirmationError'
import { isBlindSigningPayload, isEIP712TypedData } from '@safe-global/utils/utils/safe-messages'
import ApprovalEditor from '@/components/tx/ApprovalEditor'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import { isWalletRejection } from '@/utils/wallets'
import { useAppSelector } from '@/store'
import { selectBlindSigning } from '@/store/settingsSlice'
import NextLink from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import MsgShareLink from '@/components/safe-messages/MsgShareLink'
import LinkIcon from '@/public/images/messages/link.svg'
import CheckWallet from '@/components/common/CheckWallet'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { getDomainHash, getSafeMessageMessageHash } from '@safe-global/utils/utils/safe-hashes'
import type { SafeVersion } from '@safe-global/types-kit'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { RiskConfirmation } from '../../features/RiskConfirmation'

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
    status: 'NEEDS_CONFIRMATION',
    type: 'MESSAGE',
  }
}

const MessageHashField = ({ label, hashValue }: { label: string; hashValue: string }) => (
  <>
    <Typography variant="paragraph-small" className="mt-4 block font-bold">
      {label}:
    </Typography>
    <div data-testid="message-hash" className="text-sm">
      <EthHashInfo address={hashValue} showAvatar={false} shortAddress={false} showCopyButton />
    </div>
  </>
)

const DialogHeader = ({ threshold }: { threshold: number }) => (
  <>
    <div className="mb-4 text-center">
      <RequiredIcon className="inline-block size-9" />
    </div>
    <Typography variant="h4" align="center" className="mb-2">
      Confirm message
    </Typography>
    {threshold > 1 && (
      <Typography align="center" className="mb-4">
        To sign this message, collect signatures from <b>{threshold} signers</b> of your Safe account.
      </Typography>
    )}
  </>
)

const MessageDialogError = ({ isOwner, submitError }: { isOwner: boolean; submitError: Error | undefined }) => {
  const wallet = useWallet()
  const onboard = useOnboard()

  const errorMessage =
    !wallet || !onboard
      ? 'No wallet is connected.'
      : !isOwner
        ? "You are currently not a signer of this Safe account and won't be able to confirm this message."
        : submitError && isWalletRejection(submitError)
          ? 'User rejected signing.'
          : submitError
            ? 'Error confirming the message. Please try again.'
            : null

  if (errorMessage) {
    return <ErrorMessage>{errorMessage}</ErrorMessage>
  }
  return null
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
  return (
    <SuccessMessage>
      <div className="flex flex-row justify-between gap-4">
        <div className="basis-7/12">Your connected wallet has already signed this message.</div>
        <div className="basis-4/12">
          <Button size="sm" onClick={handleSwitchWallet} className="w-full">
            Switch wallet
          </Button>
        </div>
      </div>
    </SuccessMessage>
  )
}

const BlindSigningWarning = ({
  isBlindSigningEnabled,
  isBlindSigningPayload,
}: {
  isBlindSigningEnabled: boolean
  isBlindSigningPayload: boolean
}) => {
  const router = useRouter()
  const query = router.query.safe ? { safe: router.query.safe } : undefined

  if (!isBlindSigningPayload) {
    return null
  }

  return (
    <ErrorMessage level={isBlindSigningEnabled ? 'warning' : 'error'}>
      This request involves{' '}
      <Link render={<NextLink href={{ pathname: AppRoutes.settings.security, query }} />}>blind signing</Link>, which
      can lead to unpredictable outcomes.
      <br />
      {isBlindSigningEnabled ? (
        'Proceed with caution.'
      ) : (
        <>
          If you wish to proceed, you must first{' '}
          <Link render={<NextLink href={{ pathname: AppRoutes.settings.security, query }} />}>
            enable blind signing
          </Link>
          .
        </>
      )}
    </ErrorMessage>
  )
}

const SuccessCard = ({ safeMessage, onContinue }: { safeMessage: MessageItem; onContinue: () => void }) => {
  return (
    <TxCard>
      <Typography variant="h4" align="center" className="mb-2">
        Message successfully signed
      </Typography>
      <MsgSigners msg={safeMessage} showOnlyConfirmations showMissingSignatures />
      <div className="flex items-center p-2">
        <Button onClick={onContinue} disabled={!safeMessage.preparedSignature}>
          Continue
        </Button>
      </div>
    </TxCard>
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
    <>
      <TxCard>
        <div className="p-4">
          <DialogHeader threshold={safe.threshold} />

          {isEip712 && (
            <ObservabilityErrorBoundary fallback={<div>Error parsing data</div>}>
              <ApprovalEditor safeMessage={decodedMessage} />
            </ObservabilityErrorBoundary>
          )}

          <BlindSigningWarning
            isBlindSigningEnabled={isBlindSigningEnabled}
            isBlindSigningPayload={isBlindSigningRequest}
          />

          <Typography className="mt-4 mb-2 font-bold">
            Message: <CopyButton text={decodedMessageAsString} />
          </Typography>
          <DecodedMsg message={decodedMessage} isInModal />

          <Accordion className="mt-4">
            <AccordionItem value="message-details">
              <AccordionTrigger data-testid="message-details">SafeMessage details</AccordionTrigger>
              <AccordionContent>
                <MessageHashField label="SafeMessage" hashValue={safeMessageMessage} />
                <MessageHashField label="SafeMessage hash" hashValue={safeMessageHash} />
                <MessageHashField label="Domain hash" hashValue={domainHash} />
                <MessageHashField label="Message hash" hashValue={messageHash} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="[&:not(:empty)]:mt-4">
            <RiskConfirmation />
          </div>
        </div>
      </TxCard>
      {isFullySigned ? (
        <SuccessCard onContinue={onContinue} safeMessage={safeMessage} />
      ) : (
        <>
          <TxCard>
            <AlreadySignedByOwnerMessage hasSigned={signedByCurrentSafe} />

            <InfoBox
              title="Collect all the confirmations"
              message={
                requestId && !hasSignature
                  ? 'Please keep this modal open until all signers confirm this message. Closing the modal will abort the signing request.'
                  : 'The signature will be submitted to the requesting app when the message is fully signed.'
              }
            >
              <MsgSigners
                msg={safeMessage ?? createSkeletonMessage(safe.threshold)}
                showOnlyConfirmations
                showMissingSignatures
                backgroundColor="var(--color-info-background)"
              />
            </InfoBox>

            {hasSignature && (
              <InfoBox
                title="Share the link with other owners"
                message={
                  <>
                    <Typography className="mb-4">
                      The owners will receive a notification about signing the message. You can also share the link with
                      them to speed up the process.
                    </Typography>
                    <MsgShareLink safeMessageHash={safeMessageHash} button />
                  </>
                }
                icon={LinkIcon}
              />
            )}

            <NetworkWarning />

            <MessageDialogError isOwner={isOwner} submitError={submitError} />

            <RiskConfirmationError />

            {!safe.deployed && <ErrorMessage>Your Safe account is not activated yet.</ErrorMessage>}
          </TxCard>
          <TxCard>
            <div className="flex items-center p-2">
              <CheckWallet checkNetwork={!isDisabled}>
                {(isOk) => (
                  <Button onClick={handleSign} disabled={!isOk || isDisabled}>
                    Sign
                  </Button>
                )}
              </CheckWallet>
            </div>
          </TxCard>
        </>
      )}
    </>
  )
}

export default SignMessage
