import { Grid, DialogActions, Button, Box, Typography, DialogContent, SvgIcon } from '@mui/material'
import { useMemo, useState } from 'react'
import { getSafeMessage } from '@gnosis.pm/safe-react-gateway-sdk'
import type { ReactElement } from 'react'
import type { SafeMessage } from '@gnosis.pm/safe-react-gateway-sdk'
import type { RequestId } from '@gnosis.pm/safe-apps-sdk'

import ModalDialog, { ModalDialogTitle } from '@/components/common/ModalDialog'
import SafeAppIcon from '@/components/safe-apps/SafeAppIcon'
import Msg from '@/components/safeMessages/Msg'
import EthHashInfo from '@/components/common/EthHashInfo'
import RequiredIcon from '@/public/images/messages/required.svg'
import { dispatchSafeMsgConfirmation, dispatchSafeMsgProposal } from '@/services/safe-messages/safeMsgSender'
import useSafeInfo from '@/hooks/useSafeInfo'
import { generateSafeMessageHash } from '@/utils/safe-messages'
import { getDecodedMessage } from '@/components/safe-apps/utils'

import txStepperCss from '@/components/tx/TxStepper/styles.module.css'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useAsync from '@/hooks/useAsync'
import useWallet from '@/hooks/wallets/useWallet'

const APP_LOGO_FALLBACK_IMAGE = '/images/apps/apps-icon.svg'

type BaseProps = {
  onClose: () => void
} & Pick<SafeMessage, 'logoUri' | 'name' | 'message'>

// Custom Safe Apps do not have a `safeAppId`
type ProposeProps = BaseProps & {
  safeAppId?: number
  messageHash?: never
  requestId: RequestId
}

// A proposed message does not return the `safeAppId` but the `logoUri` and `name` of the Safe App that proposed it
type ConfirmProps = BaseProps & {
  safeAppId?: never
  messageHash: string
  requestId?: RequestId
}

const MsgModal = ({
  onClose,
  logoUri = APP_LOGO_FALLBACK_IMAGE,
  name,
  message,
  messageHash,
  safeAppId,
  requestId,
}: ProposeProps | ConfirmProps): ReactElement => {
  // Hooks & variables
  const [submitError, setSubmitError] = useState<Error | undefined>()

  const { safe } = useSafeInfo()
  const isWrongChain = useIsWrongChain()
  const isOwner = useIsSafeOwner()
  const wallet = useWallet()

  // Decode message if UTF-8 encoded
  const decodedMessage = useMemo(() => {
    return typeof message === 'string' ? getDecodedMessage(message) : message
  }, [message])

  // Get `SafeMessage` hash
  const hash = useMemo(() => {
    return messageHash ?? generateSafeMessageHash(safe, decodedMessage)
  }, [messageHash, safe, decodedMessage])

  // Get message from backend
  const [backendMessage] = useAsync(() => {
    if (!hash) {
      return
    }
    return getSafeMessage(safe.chainId, hash)
  }, [safe.chainId, hash, safe?.messagesTag])

  const hasSigned = !!backendMessage?.confirmations.some(({ owner }) => owner.value === wallet?.address)

  const isDisabled = isWrongChain || !isOwner || hasSigned

  const onSign = async () => {
    setSubmitError(undefined)

    try {
      if (requestId && !backendMessage) {
        await dispatchSafeMsgProposal(safe, decodedMessage, requestId, safeAppId)
      } else {
        await dispatchSafeMsgConfirmation(safe, decodedMessage, requestId)
      }

      onClose()
    } catch (e) {
      setSubmitError(e as Error)
    }
  }

  return (
    <ModalDialog open onClose={onClose} maxWidth="sm" fullWidth>
      <div className={txStepperCss.container}>
        <ModalDialogTitle onClose={onClose}>
          <Grid container px={1} alignItems="center" gap={2}>
            <Grid item>
              <Box display="flex" alignItems="center">
                <SafeAppIcon
                  src={logoUri || APP_LOGO_FALLBACK_IMAGE}
                  alt={name || 'An icon of an application'}
                  width={24}
                  height={24}
                />
                <Typography variant="h4">{name}</Typography>
              </Box>
            </Grid>
          </Grid>
        </ModalDialogTitle>

        <DialogContent>
          <Box textAlign="center" mt={4} mb={2}>
            <SvgIcon component={RequiredIcon} viewBox="0 0 32 32" fontSize="large" />
          </Box>
          <Typography variant="h4" textAlign="center" gutterBottom>
            Confirm message
          </Typography>
          <Typography variant="body1" textAlign="center" mb={2}>
            This action will confirm the message and add your confirmation to the prepared signature.
          </Typography>
          <Typography fontWeight={700}>Message:</Typography>
          <Msg message={decodedMessage} />
          <Typography fontWeight={700} mt={2}>
            Hash:
          </Typography>
          <EthHashInfo address={hash} showAvatar={false} shortAddress={false} showCopyButton />

          {isWrongChain ? (
            <ErrorMessage>Your wallet is connected to the wrong chain.</ErrorMessage>
          ) : !isOwner ? (
            <ErrorMessage>
              You are currently not an owner of this Safe and won&apos;t be able to confirm this message.
            </ErrorMessage>
          ) : hasSigned ? (
            <ErrorMessage>Your connected wallet has already signed this message.</ErrorMessage>
          ) : submitError ? (
            <ErrorMessage error={submitError}>Error confirming the message. Please try again.</ErrorMessage>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button color="inherit" onClick={onSign} disabled={isDisabled}>
            Sign
          </Button>
        </DialogActions>
      </div>
    </ModalDialog>
  )
}

export default MsgModal
