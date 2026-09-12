import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { isGtfSafePaid } from '@safe-global/utils/utils/isGtfSafePaid'
import { isMultisigDetailedExecutionInfo } from '@/src/utils/transaction-guards'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { FeeParams } from '@/src/hooks/useFeeParams/useFeeParams'
import { Signer } from '@/src/store/signersSlice'
import { BIOMETRY_ROTATION_DESCRIPTION, BiometryInvalidationError } from '@/src/services/key-storage'
import { isExecutionError } from '@/src/services/tx-execution/executionErrors'

export const txRequiresRelay = (txDetails?: TransactionDetails): boolean => {
  const info = txDetails?.detailedExecutionInfo
  if (!info || !isMultisigDetailedExecutionInfo(info)) {
    return false
  }
  return isGtfSafePaid({
    gasPrice: info.gasPrice,
    baseGas: info.baseGas,
    refundReceiver: info.refundReceiver?.value,
  })
}

/**
 * Signers that already confirmed the transaction, for the pre-broadcast
 * threshold check. Returns `undefined` while the details are unavailable or
 * are not a multisig execution, so the caller can tell "unknown" apart from
 * "nobody has confirmed" and skip the check instead of blocking.
 */
export const getConfirmedSigners = (txDetails?: TransactionDetails): string[] | undefined => {
  const executionInfo = txDetails?.detailedExecutionInfo
  if (!isMultisigDetailedExecutionInfo(executionInfo)) {
    return undefined
  }
  return executionInfo.confirmations.map((confirmation) => confirmation.signer.value)
}

/**
 * Execution path types for the confirm flow
 */
export type ExecutionPath = 'ledger' | 'walletconnect' | 'biometrics' | 'standard'

/**
 * Determines the execution method based on user selection, relay availability, and signer type
 */
export const getExecutionMethod = (
  requestedMethod: ExecutionMethod,
  isRelayAvailable: boolean,
  chain: Chain,
  signer?: Signer,
  requiresRelay = false,
): ExecutionMethod => {
  const isRelayEnabled = !!chain && hasFeature(chain, FEATURES.RELAYING)

  // GTF Safe-pays txs MUST relay, the Safe reimburses the relayer regardless of who executes, so a
  // signer-EOA route would double-pay. Force relay (bypassing the daily quota) whenever the chain
  // supports relaying. The "relay not available" case is handled by the caller as a terminal state.
  if (requiresRelay && isRelayEnabled) {
    return ExecutionMethod.WITH_RELAY
  }

  // Relay takes priority if requested and available
  if (requestedMethod === ExecutionMethod.WITH_RELAY && isRelayAvailable && isRelayEnabled) {
    return ExecutionMethod.WITH_RELAY
  }

  // Ledger signer uses Ledger execution
  if (signer?.type === 'ledger') {
    return ExecutionMethod.WITH_LEDGER
  }

  // WalletConnect signer uses WC execution
  if (signer?.type === 'walletconnect') {
    return ExecutionMethod.WITH_WC
  }

  // Default to private key execution
  return ExecutionMethod.WITH_PK
}

/**
 * Gets the submit button text based on funds availability
 */
export const getSubmitButtonText = (hasSufficientFunds: boolean) => {
  if (!hasSufficientFunds) {
    return 'Insufficient funds'
  }

  return 'Execute transaction'
}

/**
 * Builds route parameters from fee params for navigation
 */
export const buildRouteParams = (txId: string, executionMethod: ExecutionMethod, feeParams: FeeParams) => ({
  txId,
  executionMethod,
  maxFeePerGas: feeParams.maxFeePerGas?.toString(),
  maxPriorityFeePerGas: feeParams.maxPriorityFeePerGas?.toString(),
  gasLimit: feeParams.gasLimit?.toString(),
  nonce: feeParams.nonce?.toString(),
})

/**
 * Determines which execution path to use based on signer type, biometrics, and execution method.
 * When relay is selected, always use standard path (relay doesn't require Ledger signing).
 */
export const determineExecutionPath = (
  activeSigner: Signer | undefined,
  isBiometricsEnabled: boolean,
  executionMethod?: ExecutionMethod,
): ExecutionPath => {
  // If relay is selected, use standard path (relay uses existing signatures, doesn't need Ledger signing)
  if (executionMethod === ExecutionMethod.WITH_RELAY) {
    return 'standard'
  }

  // Ledger signer uses Ledger path (unless relay was selected above)
  if (activeSigner?.type === 'ledger') {
    return 'ledger'
  }

  // WalletConnect signer uses standard path (no local key, skip biometrics)
  if (activeSigner?.type === 'walletconnect') {
    return 'walletconnect'
  }

  if (!isBiometricsEnabled) {
    return 'biometrics'
  }

  return 'standard'
}

/**
 * Extracts a user-facing message from an unknown error, mapping biometry
 * invalidation to the shared re-import copy and falling back to `fallback`
 * for non-Error throwables.
 */
export const getErrorMessage = (error: unknown, fallback = 'Failed to execute transaction'): string => {
  if (error instanceof BiometryInvalidationError) {
    return BIOMETRY_ROTATION_DESCRIPTION
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

/**
 * Support reference to render beneath a classified execution failure. The
 * shared contract-error copy points at it, so it has to be shown wherever that
 * copy is.
 */
export const getErrorReference = (error: unknown): string | undefined =>
  isExecutionError(error) ? error.code : undefined
