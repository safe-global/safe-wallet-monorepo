import type { AddressInfo, MultisigConfirmationDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SignatureGaugeTone } from '@safe-global/views/features/spaces/components/SpaceQueue/SignatureGauge'
import type { QueueStatus } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export type SignerStatus = AddressInfo & { signed: boolean }

export const getSignersHeader = (submitted: number, required: number, unsignedCount?: number): string => {
  const progress = `${submitted} of ${required} signed`
  if (submitted >= required) return `${progress} · threshold met`
  const missing = required - submitted
  if (unsignedCount === undefined) return `${progress} · ${missing} more needed`
  return `${progress} · ${missing} more from ${unsignedCount} ${unsignedCount === 1 ? 'signer' : 'signers'}`
}

/** The user first, then the owners who signed, then the rest, each group in owner order */
export const sortSigners = (
  signers: AddressInfo[],
  confirmations: MultisigConfirmationDetails[],
  isYou: (address: string) => boolean = () => false,
): SignerStatus[] => {
  const statuses = signers.map((signer) => ({
    ...signer,
    signed: confirmations.some(({ signer: { value } }) => sameAddress(value, signer.value)),
  }))
  const rank = ({ value, signed }: SignerStatus) => (isYou(value) ? 0 : signed ? 1 : 2)
  return [...statuses].sort((a, b) => rank(a) - rank(b))
}

/** Green when the user can act on it now, amber when they must wait on others or on an earlier transaction */
export const getGaugeTone = (status: QueueStatus): SignatureGaugeTone =>
  status === 'sign' || status === 'execute' ? 'success' : 'warning'

export const getStatusTitle = (status: QueueStatus, nextNonce?: number): string => {
  if (status === 'execute') return 'Ready to execute'
  if (status === 'sign') return 'Ready to sign'
  if (status === 'waiting') return 'Signing'
  return nextNonce === undefined ? 'Blocked' : `Blocked by #${nextNonce}`
}

/** Up to two names, else a count: "Ana", "Ana and Max", "3 signers" */
const people = (names: string[]): string => (names.length > 2 ? `${names.length} signers` : names.join(' and '))

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`

type StatusHintArgs = {
  status: QueueStatus
  nonce?: number
  nextNonce?: number
  /** Signatures still needed */
  missing: number
  /** Names of the owners other than the user who haven't signed yet, once the details are in */
  waitingOn?: string[]
}

const getWaitingHint = (missing: number, waitingOn?: string[]): string => {
  if (!waitingOn?.length) return `Waiting on ${plural(missing, 'more signature')}.`
  const who = missing < waitingOn.length ? `${missing} more from ${people(waitingOn)}` : people(waitingOn)
  return `Waiting on ${who}.`
}

/** The next step: what the user can do now, or what the transaction waits on */
export const getStatusHint = ({ status, nonce, nextNonce, missing, waitingOn }: StatusHintArgs): string => {
  const behind = nonce !== undefined && nextNonce !== undefined && nonce > nextNonce
  const after = behind ? `Executes after #${nextNonce}. ` : ''
  switch (status) {
    case 'execute':
      return 'Fully signed and next in line. Execute it.'
    case 'sign':
      if (behind) return `${after}You can sign this now.`
      return missing === 1 ? 'Yours is the last signature needed.' : 'Needs your signature. Sign it.'
    case 'waiting':
      return `${after}${getWaitingHint(missing, waitingOn)}`
    case 'blocked':
      return nextNonce === undefined
        ? 'Fully signed. Executes after an earlier transaction.'
        : `Fully signed. Executes after #${nextNonce}.`
  }
}

/** The gauge's accessible name: the status, then the count */
export const getGaugeLabel = (title: string, submitted: number, required: number): string =>
  `${title}. ${submitted} of ${plural(required, 'signature')}`
