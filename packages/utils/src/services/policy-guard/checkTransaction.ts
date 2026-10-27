import { Interface, ZeroAddress } from 'ethers'
import type { Address } from 'viem'

/**
 * The guard's own transaction hook. The Safe calls it before executing, so simulating it with the
 * Safe as `from` answers whether the policies would let a transaction through.
 */
const GUARD_CHECK_ABI = [
  'function checkTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures,address msgSender)',
] as const

/**
 * Errors the engine raises. `AccessDenied` and `PolicyReverted` are the policy verdicts; the rest
 * are the guard refusing the shape of the transaction itself.
 */
const GUARD_ERRORS_ABI = [
  'error AccessDenied(address policy)',
  'error PolicyReverted(address policy, bytes reason)',
  'error NonZeroGasPrice()',
  'error NonZeroSafeTxGas()',
  'error GuardTargetDenied()',
  'error ModuleConfigurationDenied()',
  'error NotChecking()',
  'error CrossSafeCheck()',
  'error Reentrancy()',
] as const

/** The policies' own errors, as forwarded inside `PolicyReverted`. */
const POLICY_ERRORS_ABI = [
  'error Unauthorized()',
  'error InvalidTransfer()',
  'error InvalidSelector()',
  'error InvalidOperation()',
  'error InvalidMultiSend()',
  'error CalldataNotPermitted()',
  'error NoCosignerConfigured()',
  'error CoSignatureAlreadySpent()',
] as const

const guardIface = new Interface(GUARD_CHECK_ABI)
const errorsIface = new Interface([...GUARD_ERRORS_ABI, ...POLICY_ERRORS_ABI])

export type GuardCheckTransaction = {
  to: string
  value: string | bigint
  data: string
  /** 0 = CALL, 1 = DELEGATECALL. */
  operation: number
}

/**
 * Calldata for the guard's pre-execution check.
 *
 * `gasPrice` and `safeTxGas` are zero because the guard rejects anything else outright — it does
 * not support gas refunds — and the wallet builds its transactions that way too. `signatures` is
 * empty: the guard reads an optional context extension from it and falls back to none, so an
 * unsigned transaction can still be checked.
 */
export const encodeGuardCheck = (tx: GuardCheckTransaction): string =>
  guardIface.encodeFunctionData('checkTransaction', [
    tx.to,
    tx.value,
    tx.data || '0x',
    tx.operation,
    0n,
    0n,
    0n,
    ZeroAddress,
    ZeroAddress,
    '0x',
    ZeroAddress,
  ])

export type GuardCheckResult =
  /** Every policy the transaction touches permits it. */
  | { status: 'allowed' }
  /** No policy covers this action and the Safe has no fallback, so the guard refuses it. */
  | { status: 'no-policy' }
  /** A policy is configured for this action and rejected it. */
  | { status: 'denied'; policy: Address; reason?: string }
  /** The guard refuses the transaction's shape, whatever the policies say. */
  | { status: 'unsupported'; reason: string }
  /** Nothing recognisable came back, so no claim is made. */
  | { status: 'unknown'; raw?: string }

const parseError = (data: string | undefined) => {
  if (!data || data === '0x') return null
  try {
    return errorsIface.parseError(data)
  } catch {
    return null
  }
}

const UNSUPPORTED_REASONS: Record<string, string> = {
  NonZeroGasPrice: 'The policy guard does not allow gas refunds, so a transaction with a gas price is refused.',
  NonZeroSafeTxGas: 'The policy guard requires safeTxGas to be zero so a failed transaction reverts atomically.',
  GuardTargetDenied:
    'The policy guard only accepts a policy change it already holds — requesting, applying or invalidating one — and only with no value attached.',
  ModuleConfigurationDenied: 'Policies cannot be configured through a module transaction.',
}

/**
 * What the guard's revert says about a transaction.
 *
 * `PolicyReverted` is unwrapped rather than reported as-is: a policy that recurses — MultiSendPolicy
 * checking each call in a batch — forwards the inner verdict, so the reason worth showing is the
 * innermost one, not the wrapper.
 */
export const decodeGuardCheckFailure = (revertData: string | undefined): GuardCheckResult => {
  const parsed = parseError(revertData)
  if (!parsed) return { status: 'unknown', raw: revertData && revertData !== '0x' ? revertData : undefined }

  if (parsed.name === 'PolicyReverted') {
    const policy = parsed.args[0] as Address
    const reason = parsed.args[1] as string
    const inner = parseError(reason)

    // A policy that recurses — MultiSendPolicy checking each call in a batch — forwards the
    // engine's verdict for the inner call. That verdict is the useful one, not the wrapper.
    if (inner?.name === 'AccessDenied' || inner?.name === 'PolicyReverted') {
      return decodeGuardCheckFailure(reason)
    }

    return { status: 'denied', policy, reason: inner?.name }
  }

  if (parsed.name === 'AccessDenied') {
    const policy = parsed.args[0] as Address
    return policy === ZeroAddress ? { status: 'no-policy' } : { status: 'denied', policy }
  }

  const unsupported = UNSUPPORTED_REASONS[parsed.name]
  if (unsupported) return { status: 'unsupported', reason: unsupported }

  return { status: 'unknown', raw: revertData }
}
