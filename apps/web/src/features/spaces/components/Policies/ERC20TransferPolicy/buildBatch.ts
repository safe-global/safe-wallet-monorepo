import { AbiCoder, getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { NO_SELECTOR } from '../shared/accessSelector'
import { OPERATION_CALL, type PolicyConfiguration } from '../shared/guardTx'
import { assemblePolicyBatch, type PolicyBatch, type PolicyBatchContext } from '../shared/buildPolicyBatch'
import { isNativeTokenAddress } from '../shared/erc20'
import { ERC20_TRANSFER_SELECTOR, ERC20_TRANSFER_FROM_SELECTOR, RECIPIENT_DATA_TYPE } from './contracts'

/**
 * One recipient in a token's allowlist. `allowed: false` REMOVES a previously
 * allowed recipient (edit mode) — the caller computes the add/remove diff and
 * passes the final flags; this builder just encodes them faithfully.
 */
export type AllowlistRecipient = { address: Address; allowed: boolean }

/** The desired allowlist for a single ERC20 token. */
export type TokenAllowlist = { token: Address; recipients: AllowlistRecipient[] }

export type BuildTokenWithdrawBatchInput = PolicyBatchContext & {
  /** The ERC20TransferPolicy contract address (from the policy response). */
  policyContract: Address
  /**
   * The NativeTransferPolicy address. Required only when the allowlist covers the native coin,
   * which the guard keys per recipient rather than per token.
   */
  nativePolicyContract?: Address
  /**
   * The recipients the Safe already permits native transfers to. Anyone here but not in the
   * submitted allowlist has their access cleared, so removing a recipient actually revokes them.
   */
  currentNativeRecipients?: Address[]
  /** One entry per token being configured. */
  allowlist: TokenAllowlist[]
  /** Also restrict `transferFrom` (adds a second Configuration per token). Default false. */
  restrictTransferFrom?: boolean
}

/**
 * Encode `abi.encode(RecipientData[])` for one token's allowlist.
 * De-dupes recipients by address (last write wins) and checksums addresses.
 */
const encodeRecipientData = (recipients: AllowlistRecipient[]): string => {
  const byAddress = new Map<string, boolean>()
  for (const r of recipients) {
    if (!isAddress(r.address)) throw new Error(`Invalid recipient address: ${r.address}`)
    byAddress.set(getAddress(r.address), r.allowed)
  }
  const deduped = Array.from(byAddress, ([recipient, allowed]) => ({ recipient, allowed }))
  return AbiCoder.defaultAbiCoder().encode([RECIPIENT_DATA_TYPE], [deduped])
}

/**
 * Assembles the multi-send for creating/editing the Token Withdraw policy.
 *
 * Guard NOT yet active (`immediate`):
 *   Tx 1 (optional) — `setGuard(SafePolicyGuard)` on the Safe, iff the guard
 *     isn't already the policy guard.
 *   Tx 2 — `configureImmediately([Configuration])` on the guard.
 *
 * Guard ALREADY active (`request`):
 *   Tx 1 — `requestConfiguration(root)` on the guard. `configureImmediately`
 *     would revert in `checkTransaction`; the change must go through the delayed
 *     request/apply path. Apply happens later, after DELAY.
 *
 * Pure — no network. The caller resolves addresses (from the policy response)
 * and the current guard (via `usePolicyGuard`) and passes them in.
 */
export type BuildTokenWithdrawBatchResult = PolicyBatch

const checksummed = (addresses: Address[]): string[] => addresses.map((address) => getAddress(address))

/**
 * The native coin has no transfer selector, so the guard cannot key it by token the way an ERC20
 * allowlist is keyed. Each permitted recipient is its own `(recipient, 0x00000000, CALL)` access
 * bound to NativeTransferPolicy, which carries no payload.
 *
 * Because the recipients are separate accesses rather than one list, re-configuring does not
 * replace them: a recipient left out of the new allowlist keeps its access until it is cleared.
 * Setting an access to the zero policy clears it, and the call then falls to the Safe's fallback
 * policy — so dropped recipients are revoked here rather than silently left permitted.
 */
const buildNativeConfigurations = (
  entry: TokenAllowlist,
  nativePolicyContract: Address | undefined,
  currentNativeRecipients: Address[],
): PolicyConfiguration[] => {
  if (!nativePolicyContract || !isAddress(nativePolicyContract)) {
    throw new Error('Missing or invalid NativeTransferPolicy address')
  }

  const allowed = checksummed(entry.recipients.filter((recipient) => recipient.allowed).map(({ address }) => address))
  const granted = allowed.map((target) => ({
    target,
    selector: NO_SELECTOR,
    operation: OPERATION_CALL,
    policy: nativePolicyContract,
    data: '0x',
  }))

  const allowedSet = new Set(allowed.map((address) => address.toLowerCase()))
  const revoked = checksummed(currentNativeRecipients)
    .filter((target) => !allowedSet.has(target.toLowerCase()))
    .map((target) => ({
      target,
      selector: NO_SELECTOR,
      operation: OPERATION_CALL,
      policy: ZERO_ADDRESS,
      data: '0x',
    }))

  return [...granted, ...revoked]
}

export const buildTokenWithdrawBatch = (input: BuildTokenWithdrawBatchInput): BuildTokenWithdrawBatchResult => {
  const { policyContract, nativePolicyContract, currentNativeRecipients = [], allowlist, restrictTransferFrom } = input

  if (allowlist.length === 0) throw new Error('Select at least one token')
  if (allowlist.some((entry) => entry.recipients.length === 0)) {
    throw new Error('Each token needs at least one recipient')
  }

  const hasErc20 = allowlist.some((entry) => !isNativeTokenAddress(entry.token))
  if (hasErc20 && !isAddress(policyContract)) throw new Error('Missing or invalid ERC20TransferPolicy address')

  const selectors = restrictTransferFrom
    ? [ERC20_TRANSFER_SELECTOR, ERC20_TRANSFER_FROM_SELECTOR]
    : [ERC20_TRANSFER_SELECTOR]

  const configurations: PolicyConfiguration[] = allowlist.flatMap((entry) => {
    if (isNativeTokenAddress(entry.token)) {
      return buildNativeConfigurations(entry, nativePolicyContract, currentNativeRecipients)
    }

    if (!isAddress(entry.token)) throw new Error(`Invalid token address: ${entry.token}`)
    const target = getAddress(entry.token)
    const data = encodeRecipientData(entry.recipients)
    return selectors.map((selector) => ({
      target,
      selector,
      operation: OPERATION_CALL,
      policy: policyContract,
      data,
    }))
  })

  return assemblePolicyBatch(input, configurations)
}
