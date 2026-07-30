import { useMemo } from 'react'
import { getAddress, isAddress, JsonRpcProvider, ZeroAddress } from 'ethers'
import semverSatisfies from 'semver/functions/satisfies'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType, type SafeTransaction } from '@safe-global/types-kit'
import { ERC721__factory, Multi_send__factory, Safe__factory } from '@safe-global/utils/types/contracts'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { type AnalysisResult, Severity, ThreatStatus } from '../types'

const safeInterface = Safe__factory.createInterface()
const SET_GUARD_SELECTOR = safeInterface.getFunction('setGuard').selector
const MULTI_SEND_SELECTOR = Multi_send__factory.createInterface().getFunction('multiSend').selector

// Safe Guard interface id: type(Guard).interfaceId (checkTransaction ^ checkAfterExecution).
const GUARD_INTERFACE_ID = '0xe6d7a83a'

// setGuard gained the ERC-165 interface check in v1.4.1, so only older Safes can be bricked.
const VULNERABLE_TO_INVALID_GUARD = '<1.4.1'

export type InvalidGuardResult = AnalysisResult<ThreatStatus.INVALID_GUARD>

// setGuard is `authorized`, so a genuine call targets the Safe itself.
const decodeGuardFromCall = (to?: string, data?: string, safeAddress?: string): string | undefined => {
  if (!data || !to || !data.startsWith(SET_GUARD_SELECTOR)) {
    return undefined
  }
  if (safeAddress && isAddress(to) && isAddress(safeAddress) && getAddress(to) !== getAddress(safeAddress)) {
    return undefined
  }
  try {
    const [guard] = safeInterface.decodeFunctionData('setGuard', data)
    return typeof guard === 'string' ? guard : undefined
  } catch {
    return undefined
  }
}

/**
 * Collects every guard address a Safe transaction would set, whether via a direct `setGuard` call
 * or one nested inside a MultiSend batch.
 *
 * @param safeTx - The Safe transaction being analysed
 * @param safeAddress - The Safe address a genuine setGuard call must target
 * @returns The guard addresses being set (empty if the transaction sets none)
 */
export const decodeSetGuardTargets = (safeTx?: SafeTransaction, safeAddress?: string): string[] => {
  const { to, data } = safeTx?.data ?? {}
  if (!data) {
    return []
  }

  const direct = decodeGuardFromCall(to, data, safeAddress)
  if (direct) {
    return [direct]
  }

  // A genuine MultiSend batch is delegate-called; a plain call that merely starts with the
  // selector cannot execute the inner setGuard, so ignore it to avoid false positives.
  if (data.startsWith(MULTI_SEND_SELECTOR) && safeTx?.data.operation === OperationType.DelegateCall) {
    try {
      return decodeMultiSendData(data)
        .map((inner) => decodeGuardFromCall(inner.to, inner.data, safeAddress))
        .filter((guard): guard is string => !!guard)
    } catch {
      return []
    }
  }

  return []
}

const buildInvalidGuardResult = (guardAddress: string): InvalidGuardResult => ({
  severity: Severity.CRITICAL,
  type: ThreatStatus.INVALID_GUARD,
  title: 'Invalid transaction guard',
  description:
    'This address does not implement the required transaction guard interface. Setting it as the guard would block every transaction and permanently brick this Safe.',
  addresses: [{ address: guardAddress }],
})

// ethers reports a reverted call or an undecodable response (EOA / non-ERC-165 contract) with these
// codes. Any other rejection (network down, timeout, rate limit) is a transport failure, not proof
// the guard is invalid, so it must not raise a "bricked Safe" finding.
const CONTRACT_REJECTION_CODES = new Set(['CALL_EXCEPTION', 'BAD_DATA'])

const isContractRejection = (error: unknown): boolean =>
  CONTRACT_REJECTION_CODES.has((error as { code?: string })?.code ?? '')

const validateGuardInterface = async (
  guardAddress: string,
  web3ReadOnly: JsonRpcProvider,
): Promise<InvalidGuardResult | undefined> => {
  try {
    // ERC721__factory reused only for its ERC-165 `supportsInterface` method.
    const supportsGuardInterface = await ERC721__factory.connect(guardAddress, web3ReadOnly).supportsInterface(
      GUARD_INTERFACE_ID,
    )
    return supportsGuardInterface ? undefined : buildInvalidGuardResult(guardAddress)
  } catch (error) {
    // EOA, non-contract, or a contract without ERC-165 — cannot be a valid guard.
    if (isContractRejection(error)) {
      return buildInvalidGuardResult(guardAddress)
    }
    // Inconclusive transport error: surface it via useAsync rather than crying wolf.
    throw error
  }
}

/**
 * Validates the target(s) of a `setGuard` transaction (direct or inside a MultiSend) against the
 * Safe guard interface. Runs only for Safes below v1.4.1, which do not reject an invalid guard
 * on-chain and would otherwise be bricked. Returns an INVALID_GUARD finding per invalid guard.
 */
export const useGuardCheck = ({
  safeTx,
  safeAddress,
  safeVersion,
  web3ReadOnly,
}: {
  safeTx?: SafeTransaction
  safeAddress?: string
  safeVersion?: string | null
  web3ReadOnly?: JsonRpcProvider
}): AsyncResult<InvalidGuardResult[]> => {
  const guardTargets = useMemo(
    // address(0) removes the guard, which is always safe.
    () => decodeSetGuardTargets(safeTx, safeAddress).filter((addr) => addr.toLowerCase() !== ZeroAddress),
    [safeTx, safeAddress],
  )

  const isVulnerableVersion = !safeVersion || semverSatisfies(safeVersion, VULNERABLE_TO_INVALID_GUARD)
  const shouldCheck = guardTargets.length > 0 && isVulnerableVersion && !!web3ReadOnly
  const guardKey = guardTargets.join(',')

  return useAsync<InvalidGuardResult[]>(() => {
    if (!shouldCheck || !web3ReadOnly) {
      return undefined
    }
    return Promise.all(guardTargets.map((guard) => validateGuardInterface(guard, web3ReadOnly))).then((results) =>
      results.filter((result): result is InvalidGuardResult => !!result),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- guardKey tracks guardTargets by value
  }, [shouldCheck, guardKey, web3ReadOnly])
}
