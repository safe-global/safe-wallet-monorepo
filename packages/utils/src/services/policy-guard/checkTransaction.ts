import { Interface, ZeroAddress } from 'ethers'
import type { Address } from 'viem'

const GUARD_CHECK_ABI = [
  'function checkTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures,address msgSender)',
] as const

// AccessDenied and PolicyReverted are policy verdicts; the rest refuse the transaction's shape.
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

// Forwarded inside PolicyReverted.
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
  safeTxGas?: string | bigint
  baseGas?: string | bigint
  gasPrice?: string | bigint
  gasToken?: string
  refundReceiver?: string
}

/** Calldata for the guard's checkTransaction; gas fields not yet set default to zero, as the guard requires. */
export const encodeGuardCheck = (tx: GuardCheckTransaction): string =>
  guardIface.encodeFunctionData('checkTransaction', [
    tx.to,
    tx.value,
    tx.data || '0x',
    tx.operation,
    tx.safeTxGas ?? 0n,
    tx.baseGas ?? 0n,
    tx.gasPrice ?? 0n,
    tx.gasToken ?? ZeroAddress,
    tx.refundReceiver ?? ZeroAddress,
    '0x',
    ZeroAddress,
  ])

export type GuardCheckResult =
  | { status: 'allowed' }
  | { status: 'no-policy' }
  | { status: 'denied'; policy: Address; reason?: string }
  | { status: 'unsupported'; reason: string }
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

export const decodeGuardCheckFailure = (revertData: string | undefined): GuardCheckResult => {
  const parsed = parseError(revertData)
  if (!parsed) return { status: 'unknown', raw: revertData && revertData !== '0x' ? revertData : undefined }

  if (parsed.name === 'PolicyReverted') {
    const policy = parsed.args[0] as Address
    const reason = parsed.args[1] as string
    const inner = parseError(reason)

    // A recursing policy (MultiSendPolicy) forwards the verdict on the inner call, which is the useful one.
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
