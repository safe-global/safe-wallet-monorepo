import type { ComponentProps, ReactElement, ReactNode } from 'react'
import type { UrlObject } from 'url'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { EthHashInfoProps } from '@/components/common/EthHashInfo/SrcEthHashInfo'
import RequiredIcon from '@/public/images/messages/required.svg'
import ErrorMessage from '@/components/tx/ErrorMessage'
import type MsgSigners from '@/components/safe-messages/MsgSigners'
import SuccessMessage from '@/components/tx/SuccessMessage'
import InfoBox from '@/components/safe-messages/InfoBox'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import NextLink from 'next/link'
import LinkIcon from '@/public/images/messages/link.svg'

type RenderAddress = (props: EthHashInfoProps) => ReactNode

const MessageHashField = ({
  label,
  hashValue,
  renderAddress,
}: {
  label: string
  hashValue: string
  renderAddress: RenderAddress
}) => (
  <>
    <Typography variant="paragraph-small" className="mt-4 block font-bold">
      {label}:
    </Typography>
    <div data-testid="message-hash" className="text-sm">
      {renderAddress({ address: hashValue, showAvatar: false, shortAddress: false, showCopyButton: true })}
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

export type MessageDialogErrorState =
  | { kind: 'noWallet' }
  | { kind: 'notOwner' }
  | { kind: 'rejected' }
  | { kind: 'ledger'; error: Error; message: string }
  | { kind: 'submit'; error: Error; cgw?: { message: string } }

export const MessageDialogErrorView = ({ state }: { state: MessageDialogErrorState }): ReactElement => {
  if (state.kind === 'noWallet') {
    return <ErrorMessage>No wallet is connected.</ErrorMessage>
  }

  if (state.kind === 'notOwner') {
    return (
      <ErrorMessage>
        You are currently not a signer of this Safe account and won&apos;t be able to confirm this message.
      </ErrorMessage>
    )
  }

  if (state.kind === 'rejected') {
    return <ErrorMessage>User rejected signing.</ErrorMessage>
  }

  if (state.kind === 'ledger') {
    return <ErrorMessage error={state.error}>{state.message}</ErrorMessage>
  }

  return (
    <ErrorMessage error={state.error}>
      {state.cgw ? state.cgw.message : 'Error confirming the message. Try again.'}
    </ErrorMessage>
  )
}

export const AlreadySignedByOwnerMessageView = ({ onSwitchWallet }: { onSwitchWallet: () => void }): ReactElement => (
  <SuccessMessage>
    <div className="flex flex-row justify-between gap-4">
      <div className="basis-7/12">Your connected wallet has already signed this message.</div>
      <div className="basis-4/12">
        <Button size="sm" onClick={onSwitchWallet} className="w-full">
          Switch wallet
        </Button>
      </div>
    </div>
  </SuccessMessage>
)

export const BlindSigningWarningView = ({
  isBlindSigningEnabled,
  href,
}: {
  isBlindSigningEnabled: boolean
  href: UrlObject
}): ReactElement => (
  <ErrorMessage level={isBlindSigningEnabled ? 'warning' : 'error'}>
    This request involves <Link render={<NextLink href={href} />}>blind signing</Link>, which can lead to unpredictable
    outcomes.
    <br />
    {isBlindSigningEnabled ? (
      'Proceed with caution.'
    ) : (
      <>
        If you wish to proceed, you must first <Link render={<NextLink href={href} />}>enable blind signing</Link>.
      </>
    )}
  </ErrorMessage>
)

type RenderMsgSigners = (
  props: Omit<ComponentProps<typeof MsgSigners>, 'msg'> & Partial<Pick<ComponentProps<typeof MsgSigners>, 'msg'>>,
) => ReactNode

export type SignMessageViewProps = {
  threshold: number
  isEip712: boolean
  renderApprovalEditor: (fallback: ReactElement) => ReactNode
  blindSigningWarning: ReactNode
  copyButton: ReactNode
  decodedMessage: ReactNode
  hashes: { safeMessage: string; safeMessageHash: string; domainHash: string; messageHash: string }
  renderAddress: RenderAddress
  riskConfirmation: ReactNode
  isFullySigned: boolean
  canContinue: boolean
  onContinue: () => void
  renderMsgSigners: RenderMsgSigners
  alreadySignedMessage: ReactNode
  hasRequestId: boolean
  hasSignature: boolean
  shareLink: ReactNode
  networkWarning: ReactNode
  dialogError: ReactNode
  riskConfirmationError: ReactNode
  isDeployed: boolean
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  onSign: () => void
  isDisabled: boolean
}

const SignMessageView = ({
  threshold,
  isEip712,
  renderApprovalEditor,
  blindSigningWarning,
  copyButton,
  decodedMessage,
  hashes,
  renderAddress,
  riskConfirmation,
  isFullySigned,
  canContinue,
  onContinue,
  renderMsgSigners,
  alreadySignedMessage,
  hasRequestId,
  hasSignature,
  shareLink,
  networkWarning,
  dialogError,
  riskConfirmationError,
  isDeployed,
  renderCheckWallet,
  onSign,
  isDisabled,
}: SignMessageViewProps): ReactElement => {
  return (
    <>
      <TxCard>
        <div className="p-4">
          <DialogHeader threshold={threshold} />

          {isEip712 && renderApprovalEditor(<div>Error parsing data</div>)}

          {blindSigningWarning}

          <Typography className="mt-4 mb-2 font-bold">Message: {copyButton}</Typography>
          {decodedMessage}

          <Accordion className="mt-4">
            <AccordionItem value="message-details">
              <AccordionTrigger data-testid="message-details">SafeMessage details</AccordionTrigger>
              <AccordionContent>
                <MessageHashField label="SafeMessage" hashValue={hashes.safeMessage} renderAddress={renderAddress} />
                <MessageHashField
                  label="SafeMessage hash"
                  hashValue={hashes.safeMessageHash}
                  renderAddress={renderAddress}
                />
                <MessageHashField label="Domain hash" hashValue={hashes.domainHash} renderAddress={renderAddress} />
                <MessageHashField label="Message hash" hashValue={hashes.messageHash} renderAddress={renderAddress} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="[&:not(:empty)]:mt-4">{riskConfirmation}</div>
        </div>
      </TxCard>
      {isFullySigned ? (
        <TxCard>
          <Typography variant="h4" align="center" className="mb-2">
            Message successfully signed
          </Typography>
          {renderMsgSigners({ showOnlyConfirmations: true, showMissingSignatures: true })}
          <TxCardActions>
            <Button onClick={onContinue} disabled={!canContinue}>
              Continue
            </Button>
          </TxCardActions>
        </TxCard>
      ) : (
        <>
          <TxCard>
            {alreadySignedMessage}

            <InfoBox
              title="Collect all the confirmations"
              message={
                hasRequestId && !hasSignature
                  ? 'Keep this modal open until all signers confirm this message. Closing the modal will abort the signing request.'
                  : 'The signature will be submitted to the requesting app when the message is fully signed.'
              }
            >
              {renderMsgSigners({
                showOnlyConfirmations: true,
                showMissingSignatures: true,
                backgroundColor: 'var(--color-info-background)',
              })}
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
                    {shareLink}
                  </>
                }
                icon={LinkIcon}
              />
            )}

            {networkWarning}

            {dialogError}

            {riskConfirmationError}

            {!isDeployed && <ErrorMessage>Your Safe account is not activated yet.</ErrorMessage>}
          </TxCard>
          <TxCard>
            <TxCardActions>
              {renderCheckWallet((isOk) => (
                <Button onClick={onSign} disabled={!isOk || isDisabled}>
                  Sign
                </Button>
              ))}
            </TxCardActions>
          </TxCard>
        </>
      )}
    </>
  )
}

export { SignMessageView }
