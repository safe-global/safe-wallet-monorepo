/**
 * Lightweight type guards and utilities for counterfactual safe props.
 * These have NO heavy dependencies and can be safely imported anywhere.
 */
import type { SafeVersion } from '@safe-global/types-kit'
import type { UndeployedSafe, UndeployedSafeProps, ReplayedSafeProps, PredictedSafeProps } from '../types'

export const isReplayedSafeProps = (props: UndeployedSafeProps): props is ReplayedSafeProps =>
  'safeAccountConfig' in props && 'masterCopy' in props && 'factoryAddress' in props && 'saltNonce' in props

export const isPredictedSafeProps = (props: UndeployedSafeProps): props is PredictedSafeProps =>
  'safeAccountConfig' in props && !('masterCopy' in props)

export interface SafeSetupResult {
  owners: string[]
  threshold: number
  fallbackHandler: string | undefined
  safeVersion: SafeVersion | undefined
  saltNonce: string | undefined
}

/**
 * Extract safe setup from undeployed safe props.
 * This is a pure function with no heavy dependencies.
 */
export const extractCounterfactualSafeSetup = (
  undeployedSafe: UndeployedSafe | undefined,
  chainId: string | undefined,
): SafeSetupResult | undefined => {
  if (!undeployedSafe || !chainId || !undeployedSafe.props.safeAccountConfig) {
    return undefined
  }
  const { owners, threshold, fallbackHandler } = undeployedSafe.props.safeAccountConfig
  const { safeVersion, saltNonce } = isPredictedSafeProps(undeployedSafe.props)
    ? (undeployedSafe.props.safeDeploymentConfig ?? {})
    : undeployedSafe.props

  return {
    owners,
    threshold: Number(threshold),
    fallbackHandler,
    safeVersion,
    saltNonce,
  }
}
