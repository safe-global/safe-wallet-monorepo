import { AbiCoder, getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import type { MetaTransactionData } from '@safe-global/types-kit'
import {
  buildSetGuardTx,
  encodeConfiguration,
  encodeRequestConfiguration,
  computeConfigureRoot,
  OPERATION_CALL,
  type PolicyConfiguration,
} from '../shared/guardTx'
import { ERC20_TRANSFER_SELECTOR, ERC20_TRANSFER_FROM_SELECTOR, RECIPIENT_DATA_TYPE } from './contracts'

/**
 * One recipient in a token's allowlist. `allowed: false` REMOVES a previously
 * allowed recipient (edit mode) — the caller computes the add/remove diff and
 * passes the final flags; this builder just encodes them faithfully.
 */
export type AllowlistRecipient = { address: Address; allowed: boolean }

/** The desired allowlist for a single ERC20 token. */
export type TokenAllowlist = { token: Address; recipients: AllowlistRecipient[] }

export type BuildTokenWithdrawBatchInput = {
  safeAddress: Address
  /** The Safe's currently installed guard (from SafeState.guard), if any. */
  currentGuard?: Address
  /** The SafePolicyGuard address for this chain (from the policy response). */
  safePolicyGuard: Address
  /** The ERC20TransferPolicy contract address (from the policy response). */
  policyContract: Address
  /** One entry per token being configured. */
  allowlist: TokenAllowlist[]
  /** Also restrict `transferFrom` (adds a second Configuration per token). Default false. */
  restrictTransferFrom?: boolean
  /**
   * Allow overwriting a DIFFERENT (non-policy) guard already on the Safe.
   * Guard-rail: by default the builder throws if an unknown guard is set,
   * since `setGuard` would silently replace it. The wizard sets this true only
   * after an explicit user confirmation (§8.7).
   */
  allowOverwriteGuard?: boolean
}

const isSameGuard = (a: string | undefined, b: string): boolean => !!a && a.toLowerCase() === b.toLowerCase()

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
 * How the batch configures the guard:
 *  - `immediate`: guard not yet active → `setGuard` + `configureImmediately`,
 *    applied in one signed batch.
 *  - `request`: guard already active → `requestConfiguration(root)` only. The
 *    config takes effect via a SEPARATE `applyConfiguration` tx once the guard's
 *    on-chain DELAY has elapsed (a later, follow-up action).
 */
export type ConfigureMode = 'immediate' | 'request'

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
export type BuildTokenWithdrawBatchResult = {
  txs: MetaTransactionData[]
  mode: ConfigureMode
  /** The Configuration[] the batch commits to — persisted so a later applyConfiguration can replay it. */
  configurations: PolicyConfiguration[]
  /** keccak256(abi.encode(configurations)) — the on-chain configureRoot. */
  configureRoot: string
}

export const buildTokenWithdrawBatch = (input: BuildTokenWithdrawBatchInput): BuildTokenWithdrawBatchResult => {
  const { safeAddress, currentGuard, safePolicyGuard, policyContract, allowlist, restrictTransferFrom } = input

  if (!isAddress(safePolicyGuard)) throw new Error('Missing or invalid SafePolicyGuard address')
  if (!isAddress(policyContract)) throw new Error('Missing or invalid ERC20TransferPolicy address')
  if (allowlist.length === 0) throw new Error('Select at least one token')
  if (allowlist.some((entry) => entry.recipients.length === 0)) {
    throw new Error('Each token needs at least one recipient')
  }

  const guardAlreadySet = isSameGuard(currentGuard, safePolicyGuard)
  const hasUnknownGuard = !!currentGuard && !guardAlreadySet
  if (hasUnknownGuard && !input.allowOverwriteGuard) {
    throw new Error('A different transaction guard is already set on this Safe; overwriting it must be confirmed')
  }

  const selectors = restrictTransferFrom
    ? [ERC20_TRANSFER_SELECTOR, ERC20_TRANSFER_FROM_SELECTOR]
    : [ERC20_TRANSFER_SELECTOR]

  const configurations: PolicyConfiguration[] = allowlist.flatMap((entry) => {
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

  const configureRoot = computeConfigureRoot(configurations)

  // Guard already active → the immediate path reverts in checkTransaction, so
  // request the change and let it apply after the on-chain DELAY.
  if (guardAlreadySet) {
    return {
      txs: [encodeRequestConfiguration(safePolicyGuard, configurations)],
      mode: 'request',
      configurations,
      configureRoot,
    }
  }

  // Guard isn't the policy guard yet (none, or a foreign one confirmed above) →
  // install it and configure in one batch.
  const txs: MetaTransactionData[] = [
    buildSetGuardTx(safeAddress, safePolicyGuard),
    encodeConfiguration(safePolicyGuard, configurations),
  ]

  return { txs, mode: 'immediate', configurations, configureRoot }
}
