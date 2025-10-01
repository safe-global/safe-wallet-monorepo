import { _isL2 } from '@safe-global/utils/services/contracts/deployments'
import { getSafeProvider } from '@/services/tx/tx-sender/sdk'
import { SafeProvider } from '@safe-global/protocol-kit'
import {
  getCompatibilityFallbackHandlerContractInstance,
  getMultiSendCallOnlyContractInstance,
  getSafeContractInstance,
  getSafeProxyFactoryContractInstance,
  getSignMessageLibContractInstance,
} from '@safe-global/protocol-kit/dist/src/contracts/contractInstances'
import type SafeBaseContract from '@safe-global/protocol-kit/dist/src/contracts/Safe/SafeBaseContract'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import semver from 'semver'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { _getValidatedGetContractProps } from '@safe-global/utils/services/contracts/safeContracts'

// GnosisSafe

export const _resolveAndValidateSafeVersion = (safeVersion?: SafeState['version']) => {
  const resolvedVersion = safeVersion ?? getSafeSDK()?.getContractVersion()

  if (!resolvedVersion) {
    throw new Error('Safe version could not be determined')
  }

  return _getValidatedGetContractProps(resolvedVersion).safeVersion
}

const getGnosisSafeContract = async (safe: SafeState, safeProvider: SafeProvider) => {
  return getSafeContractInstance(_resolveAndValidateSafeVersion(safe.version), safeProvider, safe.address.value)
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
  chain: ChainInfo,
  safeVersion: SafeState['version'],
  isL1?: boolean,
) => {
  const version = safeVersion ?? getLatestSafeVersion(chain)

  const safeProvider = getSafeProvider()

  const validatedVersion = _resolveAndValidateSafeVersion(version)
  const isL1SafeSingleton = isL1 ?? !_isL2(chain, validatedVersion)

  return getSafeContractInstance(validatedVersion, safeProvider, undefined, undefined, isL1SafeSingleton)
}

// MultiSend

export const _getMinimumMultiSendCallOnlyVersion = (safeVersion: SafeState['version']) => {
  const INITIAL_CALL_ONLY_VERSION = '1.3.0'

  if (!safeVersion) {
    return INITIAL_CALL_ONLY_VERSION
  }

  return semver.gte(safeVersion, INITIAL_CALL_ONLY_VERSION) ? safeVersion : INITIAL_CALL_ONLY_VERSION
}

export const getReadOnlyMultiSendCallOnlyContract = async (safeVersion: SafeState['version']) => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK not found.')
  }

  const safeProvider = safeSDK.getSafeProvider()

  return getMultiSendCallOnlyContractInstance(_resolveAndValidateSafeVersion(safeVersion), safeProvider)
}

// GnosisSafeProxyFactory

export const getReadOnlyProxyFactoryContract = async (safeVersion: SafeState['version'], contractAddress?: string) => {
  const safeProvider = getSafeProvider()

  return getSafeProxyFactoryContractInstance(_resolveAndValidateSafeVersion(safeVersion), safeProvider, contractAddress)
}

// Fallback handler

export const getReadOnlyFallbackHandlerContract = async (safeVersion: SafeState['version']) => {
  const safeProvider = getSafeProvider()

  return getCompatibilityFallbackHandlerContractInstance(_resolveAndValidateSafeVersion(safeVersion), safeProvider)
}

// Sign messages deployment

export const getReadOnlySignMessageLibContract = async (safeVersion: SafeState['version']) => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK not found.')
  }

  const safeProvider = safeSDK.getSafeProvider()

  return getSignMessageLibContractInstance(_resolveAndValidateSafeVersion(safeVersion), safeProvider)
}
