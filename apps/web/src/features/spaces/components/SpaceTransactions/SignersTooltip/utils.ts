import type { AddressInfo, MultisigConfirmationDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export type SignerStatus = AddressInfo & { signed: boolean }

export const getSignersHeader = (submitted: number, required: number, unsignedCount?: number): string => {
  const progress = `${submitted} of ${required} signed`
  if (submitted >= required) return `${progress} · threshold met`
  const missing = required - submitted
  if (unsignedCount === undefined) return `${progress} · ${missing} more needed`
  return `${progress} · ${missing} more from ${unsignedCount} ${unsignedCount === 1 ? 'signer' : 'signers'}`
}

export const sortSigners = (signers: AddressInfo[], confirmations: MultisigConfirmationDetails[]): SignerStatus[] => {
  const statuses = signers.map((signer) => ({
    ...signer,
    signed: confirmations.some(({ signer: { value } }) => sameAddress(value, signer.value)),
  }))
  return [...statuses.filter(({ signed }) => signed), ...statuses.filter(({ signed }) => !signed)]
}
