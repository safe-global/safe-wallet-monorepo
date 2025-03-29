import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import {
  Grid,
  Button,
  Box,
  Typography,
  SvgIcon,
  CardContent,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
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
import RiskConfirmationError from '@/components/tx/SignOrExecuteForm/RiskConfirmationError'
import { TxSecurityContext } from '@/components/tx/security/shared/TxSecurityContext'
import { isBlindSigningPayload, isEIP712TypedData } from '@safe-global/utils/utils/safe-messages'
import ApprovalEditor from '@/components/tx/ApprovalEditor'
import { ErrorBoundary } from '@sentry/react'
import { isWalletRejection } from '@/utils/wallets'
import { useAppSelector } from '@/store'
import { selectBlindSigning } from '@/store/settingsSlice'
import NextLink from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import MsgShareLink from '@/components/safe-messages/MsgShareLink'
import LinkIcon from '@/public/images/messages/link.svg'
import { Blockaid } from '@/components/tx/security/blockaid'
import CheckWallet from '@/components/common/CheckWallet'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import { getDomainHash, getSafeMessageMessageHash } from '@/utils/safe-hashes'
import type { SafeVersion } from '@safe-global/safe-core-sdk-types'

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
    <Typography
      variant="body2"
      sx={{
        fontWeight: 700,
        mt: 2,
      }}
    >
      {label}:
    </Typography>
    <Typography data-testid="message-hash" variant="body2" component="div">
      <EthHashInfo address={hashValue} showAvatar={false} shortAddress={false} showCopyButton />
    </Typography>
  </>
)

const DialogHeader = ({ threshold }: { threshold: number }) => (
  <>
    <Box
      sx={{
        textAlign: 'center',
        mb: 2,
      }}
    >
      <SvgIcon component={RequiredIcon} viewBox="0 0 32 32" fontSize="large" />
    </Box>
    <Typography
      variant="h4"
      gutterBottom
      sx={{
        textAlign: 'center',
      }}
    >
      Confirm message
    </Typography>
    {threshold > 1 && (
      <Typography
        variant="body1"
        sx={{
          textAlign: 'center',
          mb: 2,
        }}
      >
        To sign this message, collect signatures from <b>{threshold} signers</b> of your Safe Account.
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
        ? "You are currently not a signer of this Safe Account and won't be able to confirm this message."
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
      <Grid
        container
        direction="row"
        sx={{
          justifyContent: 'space-between',
        }}
      >
        <Grid item xs={7}>
          Your connected wallet has already signed this message.
        </Grid>
        <Grid item xs={4}>
          <Button variant="contained" size="small" onClick={handleSwitchWallet} fullWidth>
            Switch wallet
          </Button>
        </Grid>
      </Grid>
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
      <Link component={NextLink} href={{ pathname: AppRoutes.settings.security, query }}>
        blind signing
      </Link>
      , which can lead to unpredictable outcomes.
      <br />
      {isBlindSigningEnabled ? (
        'Proceed with caution.'
      ) : (
        <>
          If you wish to proceed, you must first{' '}
          <Link component={NextLink} href={{ pathname: AppRoutes.settings.security, query }}>
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
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          textAlign: 'center',
        }}
      >
        Message successfully signed
      </Typography>
      <MsgSigners msg={safeMessage} showOnlyConfirmations showMissingSignatures />
      <CardActions>
        <Button variant="contained" color="primary" onClick={onContinue} disabled={!safeMessage.preparedSignature}>
          Continue
        </Button>
      </CardActions>
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
  const { setSafeMessage: setContextSafeMessage } = useContext(SafeTxContext)
  const { needsRiskConfirmation, isRiskConfirmed, setIsRiskIgnored } = useContext(TxSecurityContext)
  const { palette } = useTheme()
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
    !isOwner || signedByCurrentSafe || !safe.deployed || (!isBlindSigningEnabled && isBlindSigningRequest)

  const { onSign, submitError } = useSyncSafeMessageSigner(
    safeMessage,
    decodedMessage,
    safeMessageHash,
    requestId,
    origin,
    () => setTxFlow(undefined),
  )

  const handleSign = async () => {
    if (needsRiskConfirmation && !isRiskConfirmed) {
      setIsRiskIgnored(true)
      return
    }

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

  // Set message for redefine scan
  useEffect(() => {
    if (typeof message !== 'string') {
      setContextSafeMessage(message)
    }
  }, [message, setContextSafeMessage])

  return (
    <>
      <TxCard>
        <CardContent>
          <DialogHeader threshold={safe.threshold} />

          {isEip712 && (
            <ErrorBoundary fallback={<div>Error parsing data</div>}>
              <ApprovalEditor safeMessage={decodedMessage} />
            </ErrorBoundary>
          )}

          <BlindSigningWarning
            isBlindSigningEnabled={isBlindSigningEnabled}
            isBlindSigningPayload={isBlindSigningRequest}
          />

          <Typography
            sx={{
              fontWeight: 700,
              mt: 2,
              mb: 1,
            }}
          >
            Message: <CopyButton text={decodedMessageAsString} />
          </Typography>
          <DecodedMsg message={decodedMessage} isInModal />

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary data-testid="message-details" expandIcon={<ExpandMoreIcon />}>
              SafeMessage details
            </AccordionSummary>
            <AccordionDetails>
              <MessageHashField label="SafeMessage" hashValue={safeMessageMessage} />
              <MessageHashField label="SafeMessage hash" hashValue={safeMessageHash} />
              <MessageHashField label="Domain hash" hashValue={domainHash} />
              <MessageHashField label="Message hash" hashValue={messageHash} />
            </AccordionDetails>
          </Accordion>

          <Box sx={{ '&:not(:empty)': { mt: 2 } }}>
            <Blockaid />
          </Box>
        </CardContent>
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
                backgroundColor={palette.info.background}
              />
            </InfoBox>

            {hasSignature && (
              <InfoBox
                title="Share the link with other owners"
                message={
                  <>
                    <Typography
                      sx={{
                        mb: 2,
                      }}
                    >
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

            {!safe.deployed && <ErrorMessage>Your Safe Account is not activated yet.</ErrorMessage>}
          </TxCard>
          <TxCard>
            <CardActions>
              <CheckWallet checkNetwork={!isDisabled}>
                {(isOk) => (
                  <Button variant="contained" color="primary" onClick={handleSign} disabled={!isOk || isDisabled}>
                    Sign
                  </Button>
                )}
              </CheckWallet>
            </CardActions>
          </TxCard>
        </>
      )}
    </>
  )
}

export default SignMessage
