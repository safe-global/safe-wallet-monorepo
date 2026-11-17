import type { JsonRpcProvider } from 'ethers'
import type { SafeTransactionData } from '@safe-global/types-kit'
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit'
import type { CosignerTransactionResult } from '@safe-global/store/cosigner/cosignerApi.dto'
import { isKnownPolicyGuard } from '@safe-global/utils/features/policy-guard/constants'
import {
  evaluateCosignatures,
  hasZeroGasFields,
  isValidCosignature,
} from '@safe-global/utils/features/policy-cosigner/cosignature'
import {
  resolveCosignerRequirement,
  type CosignerRequirement,
  type EthCall,
} from '@safe-global/utils/features/policy-cosigner/requirement'
import type { CosignerState } from '../types'

export const isCosignerApplicable = (serviceUrl: string | undefined, guard: string | null | undefined): boolean =>
  !!serviceUrl && isKnownPolicyGuard(guard)

export const toEthCall =
  (provider: JsonRpcProvider): EthCall =>
  (tx) =>
    provider.call(tx)

export const getSafeTxHash = (
  safeAddress: string,
  txData: SafeTransactionData,
  safeVersion: string,
  chainId: string,
): string => calculateSafeTransactionHash(safeAddress, txData, safeVersion, BigInt(chainId))

export const getCosignerRequirement = (
  call: EthCall,
  guard: string,
  safeAddress: string,
  txData: SafeTransactionData,
): Promise<CosignerRequirement> =>
  resolveCosignerRequirement(call, guard, safeAddress, {
    to: txData.to,
    data: txData.data,
    operation: txData.operation,
  })

/** The state that follows from the requirement alone, before the service is asked */
export const getStaticCosignerState = (
  requirement: CosignerRequirement,
  txData: SafeTransactionData,
): CosignerState | undefined => {
  if (requirement.mode === 'none') return { status: 'notRequired' }
  if (requirement.mode === 'perAction') return { status: 'unsupportedBatch' }
  if (!hasZeroGasFields(txData)) return { status: 'gasNotZero', cosigner: requirement.cosigner }
  return undefined
}

export const getCosignerState = async (
  call: EthCall,
  cosigner: string,
  safeTxHash: string,
  result: CosignerTransactionResult | undefined,
): Promise<CosignerState> => {
  const outcome = evaluateCosignatures(result, cosigner)
  if (outcome.status !== 'ready') {
    return { ...outcome, cosigner }
  }

  if (await isValidCosignature(call, cosigner, safeTxHash, outcome.context)) {
    return { ...outcome, cosigner }
  }

  // An on-chain approval the service reported may not be mined yet
  return outcome.onchain
    ? { status: 'pending', cosigner }
    : { status: 'invalid', reason: 'The co-signature does not match this transaction', cosigner }
}

const SERVICE_URL_HINT = 'Check its URL in Settings › Environment variables.'

export const COSIGNER_REQUIREMENT_UNAVAILABLE =
  "Couldn't read the Safe's policy guard, so it's unknown whether this transaction needs a co-signature."

export const COSIGNATURE_UNVERIFIED = "Couldn't verify the co-signature on-chain."

/** Explains a failed request to the co-signer service, given an RTK Query error */
export const getCosignerServiceErrorMessage = (error: unknown): string => {
  const status = (error as { status?: unknown } | undefined)?.status
  if (status === 'PARSING_ERROR') {
    return `The co-signer service didn't answer with JSON. ${SERVICE_URL_HINT}`
  }
  if (typeof status === 'number') {
    return `The co-signer service answered with an error (HTTP ${status}).`
  }
  return `Can't reach the co-signer service. ${SERVICE_URL_HINT} The service must also allow requests from this app (CORS).`
}

/** The state to show when a read the co-signer decision depends on failed, if any did */
export const getUnavailableState = ({
  requirementError,
  serviceError,
  verifyError,
  cosigner,
}: {
  requirementError?: unknown
  serviceError?: unknown
  verifyError?: unknown
  cosigner?: string
}): CosignerState | undefined => {
  if (requirementError) return { status: 'unavailable', reason: COSIGNER_REQUIREMENT_UNAVAILABLE }
  if (serviceError) return { status: 'unavailable', reason: getCosignerServiceErrorMessage(serviceError), cosigner }
  if (verifyError) return { status: 'unavailable', reason: COSIGNATURE_UNVERIFIED, cosigner }
  return undefined
}

/** Execution can't go ahead in these states without the service or the transaction changing */
export const isCosignerBlocking = (state: CosignerState | undefined): boolean =>
  !!state && ['rejected', 'failed', 'invalid', 'unsupportedBatch', 'gasNotZero', 'unavailable'].includes(state.status)

export const isCosignerWaiting = (state: CosignerState | undefined): boolean =>
  !!state && (state.status === 'pending' || state.status === 'notFound' || state.status === 'notProposed')

/** What to tell the user when a tx was created but the co-signer kept it from executing */
export const getQueuedCosignerNotice = (state: CosignerState): { variant: 'info' | 'error'; message: string } =>
  isCosignerWaiting(state)
    ? {
        variant: 'info',
        message:
          'The transaction was created and is waiting for the co-signer. Execute it from the queue once it is co-signed.',
      }
    : {
        variant: 'error',
        message: `The transaction was created but can't be executed. ${getCosignerStateMessage(state)}`,
      }

export const getCosignerStateMessage = (state: CosignerState): string => {
  switch (state.status) {
    case 'notRequired':
      return 'No co-signature is needed for this transaction.'
    case 'notProposed':
      return 'The co-signer reviews this transaction once you submit it. Execution waits for its signature.'
    case 'notFound':
      return 'The co-signer reviews this transaction once it has been created.'
    case 'pending':
      return 'Waiting for the co-signer to review this transaction.'
    case 'ready':
      return 'The co-signer approved this transaction.'
    case 'rejected':
      return state.reason
        ? `The co-signer rejected this transaction: ${state.reason}`
        : 'The co-signer rejected this transaction.'
    case 'failed':
      return state.reason
        ? `The co-signer could not review this transaction: ${state.reason}`
        : 'The co-signer could not review this transaction.'
    case 'invalid':
    case 'unavailable':
      return state.reason
    case 'unsupportedBatch':
      return 'This batch needs a co-signature for each action, which is not supported yet. Execute the actions separately.'
    case 'gasNotZero':
      return 'A co-signed transaction must not set gas or refund parameters.'
  }
}
