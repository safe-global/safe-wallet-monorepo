import {
  _isL2,
  isCanonicalDeployment,
  getCanonicalMultiSendCallOnlyAddress,
} from '@safe-global/utils/services/contracts/deployments'
import { getSafeProvider } from '@/services/tx/tx-sender/sdk'
import {
  SafeProvider,
  getCompatibilityFallbackHandlerContract,
  getMultiSendCallOnlyContract,
  getSafeContract,
  getSafeProxyFactoryContract,
  getSignMessageLibContract,
} from '@safe-global/protocol-kit'
import type { SafeBaseContract } from '@safe-global/protocol-kit'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import semver from 'semver'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { _getValidatedGetContractProps } from '@safe-global/utils/services/contracts/safeContracts'

// GnosisSafe

const getGnosisSafeContract = async (safe: SafeState, safeProvider: SafeProvider) => {
  // For unsupported mastercopies, use the SDK version if available
  let version = safe.version
  if (!version) {
    const safeSDK = getSafeSDK()
    version = safeSDK?.getContractVersion() ?? null
  }

  return getSafeContract({
    safeProvider,
    safeVersion: _getValidatedGetContractProps(version).safeVersion,
    customSafeAddress: safe.address.value,
  })
}

export const getReadOnlyCurrentGnosisSafeContract = async (safe: SafeState): Promise<SafeBaseContract<any>> => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK not found.')
  }

  const safeProvider = safeSDK.getSafeProvider()

  return getGnosisSafeContract(safe, safeProvider)
}

export const getCurrentGnosisSafeContract = async (safe: SafeState, provider: string) => {
  const safeProvider = new SafeProvider({ provider })

  return getGnosisSafeContract(safe, safeProvider)
}

export const getReadOnlyGnosisSafeContract = async (
  chain: Chain,
  safeVersion: SafeState['version'],
  isL1?: boolean,
) => {
  const version = safeVersion ?? getLatestSafeVersion(chain)

  const safeProvider = getSafeProvider()

  const isL1SafeSingleton = isL1 ?? !_isL2(chain, _getValidatedGetContractProps(version).safeVersion)

  return getSafeContract({
    safeProvider,
    safeVersion: _getValidatedGetContractProps(version).safeVersion,
    isL1SafeSingleton,
  })
}

// MultiSend

export const _getMinimumMultiSendCallOnlyVersion = (safeVersion: SafeState['version']) => {
  const INITIAL_CALL_ONLY_VERSION = '1.3.0'

  if (!safeVersion) {
    return INITIAL_CALL_ONLY_VERSION
  }

  return semver.gte(safeVersion, INITIAL_CALL_ONLY_VERSION) ? safeVersion : INITIAL_CALL_ONLY_VERSION
}

export const getReadOnlyMultiSendCallOnlyContract = async (
  safeVersion: SafeState['version'],
  chainId?: string,
  implementationAddress?: string,
) => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK not found.')
  }

  const safeProvider = safeSDK.getSafeProvider()

  // For unsupported mastercopies, use the SDK version if available
  const version = safeVersion ?? safeSDK.getContractVersion()

  // On zkSync, if the Safe uses a canonical (EVM bytecode) mastercopy,
  // we must use canonical auxiliary contracts because EVM contracts
  // cannot delegatecall to EraVM contracts.
  let customContractAddress: string | undefined
  if (chainId && implementationAddress && isCanonicalDeployment(implementationAddress, chainId, version)) {
    customContractAddress = getCanonicalMultiSendCallOnlyAddress(version)
  }

  return getMultiSendCallOnlyContract({
    safeProvider,
    safeVersion: _getValidatedGetContractProps(version).safeVersion,
    customContracts: customContractAddress ? { multiSendCallOnlyAddress: customContractAddress } : undefined,
  })
}

// GnosisSafeProxyFactory

export const getReadOnlyProxyFactoryContract = async (safeVersion: SafeState['version'], contractAddress?: string) => {
  const safeProvider = getSafeProvider()

  // For unsupported mastercopies, use the SDK version if available
  let version = safeVersion
  if (!version) {
    const safeSDK = getSafeSDK()
    version = safeSDK?.getContractVersion() ?? null
  }

  return getSafeProxyFactoryContract({
    safeProvider,
    safeVersion: _getValidatedGetContractProps(version).safeVersion,
    customContracts: contractAddress ? { safeProxyFactoryAddress: contractAddress } : undefined,
  })
}

// Fallback handler

export const getReadOnlyFallbackHandlerContract = async (safeVersion: SafeState['version']) => {
  const safeProvider = getSafeProvider()

  // For unsupported mastercopies, use the SDK version if available
  let version = safeVersion
  if (!version) {
    const safeSDK = getSafeSDK()
    version = safeSDK?.getContractVersion() ?? null
  }

  return getCompatibilityFallbackHandlerContract({
    safeProvider,
    safeVersion: _getValidatedGetContractProps(version).safeVersion,
  })
}

// Sign messages deployment

export const getReadOnlySignMessageLibContract = async (safeVersion: SafeState['version']) => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK not found.')
  }

  const safeProvider = safeSDK.getSafeProvider()

  // For unsupported mastercopies, use the SDK version if available
  const version = safeVersion ?? safeSDK.getContractVersion()

  return getSignMessageLibContract({
    safeProvider,
    safeVersion: _getValidatedGetContractProps(version).safeVersion,
  })
}
