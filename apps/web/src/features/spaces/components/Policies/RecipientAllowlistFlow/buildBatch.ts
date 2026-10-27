import { AbiCoder, getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { NO_SELECTOR, OPERATION_CALL } from '../shared/accessSelector'
import type { PolicyConfiguration } from '../shared/guardTx'
import { assemblePolicyBatch, type PolicyBatch, type PolicyBatchContext } from '../shared/buildPolicyBatch'
import { isNativeTokenAddress } from '../shared/erc20'
import { ERC20_TRANSFER_SELECTOR, PERMISSION_ALWAYS, RECIPIENT_DATA_TYPE } from '../shared/erc20TransferPolicy'

export type BuildRecipientAllowlistBatchInput = PolicyBatchContext & {
  /** ERC20TransferPolicy, which every ERC-20 in the allowlist is bound to. */
  policyContract: Address
  /** NativeTransferPolicy, needed only when the allowlist covers the native coin. */
  nativePolicyContract?: Address
  /** The recipients the Safe already permits native transfers to; any not in `recipients` is revoked. */
  currentNativeRecipients?: Address[]
  tokens: Address[]
  recipients: Address[]
}

const checksummed = (addresses: Address[]): Address[] => {
  for (const address of addresses) {
    if (!isAddress(address)) throw new Error(`Invalid address: ${address}`)
  }
  return [...new Set(addresses.map((address) => getAddress(address) as Address))]
}

const encodeRecipients = (recipients: Address[]): string =>
  AbiCoder.defaultAbiCoder().encode(
    [RECIPIENT_DATA_TYPE],
    [recipients.map((recipient) => [recipient, PERMISSION_ALWAYS])],
  )

/**
 * The guard keys the native coin per recipient, since a value transfer has no selector to key a token by. Each
 * access is separate, so a recipient left out keeps its access until it is cleared with the zero policy.
 */
const nativeConfigurations = (
  recipients: Address[],
  nativePolicyContract: Address | undefined,
  currentNativeRecipients: Address[],
): PolicyConfiguration[] => {
  if (!nativePolicyContract || !isAddress(nativePolicyContract)) {
    throw new Error('Missing or invalid NativeTransferPolicy address')
  }

  const kept = new Set(recipients.map((recipient) => recipient.toLowerCase()))
  const revoked = checksummed(currentNativeRecipients).filter((recipient) => !kept.has(recipient.toLowerCase()))

  return [
    ...recipients.map((target) => ({
      target,
      selector: NO_SELECTOR,
      operation: OPERATION_CALL,
      policy: nativePolicyContract,
      data: '0x',
    })),
    ...revoked.map((target) => ({
      target,
      selector: NO_SELECTOR,
      operation: OPERATION_CALL,
      policy: ZERO_ADDRESS,
      data: '0x',
    })),
  ]
}

/** The batch that lets the selected tokens go only to the selected recipients. */
export const buildRecipientAllowlistBatch = (input: BuildRecipientAllowlistBatchInput): PolicyBatch => {
  const { policyContract, nativePolicyContract, currentNativeRecipients = [] } = input
  const tokens = checksummed(input.tokens)
  const recipients = checksummed(input.recipients)

  if (tokens.length === 0) throw new Error('Select at least one token')
  if (recipients.length === 0) throw new Error('Add at least one recipient')

  const erc20Tokens = tokens.filter((token) => !isNativeTokenAddress(token))
  if (erc20Tokens.length > 0 && !isAddress(policyContract)) {
    throw new Error('Missing or invalid ERC20TransferPolicy address')
  }

  const data = encodeRecipients(recipients)
  const configurations: PolicyConfiguration[] = [
    ...erc20Tokens.map((target) => ({
      target,
      selector: ERC20_TRANSFER_SELECTOR,
      operation: OPERATION_CALL,
      policy: policyContract,
      data,
    })),
    ...(tokens.some((token) => isNativeTokenAddress(token))
      ? nativeConfigurations(recipients, nativePolicyContract, currentNativeRecipients)
      : []),
  ]

  return assemblePolicyBatch(input, configurations)
}
