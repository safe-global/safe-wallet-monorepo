import { ContractVersions, KnownContracts, type SupportedNetworks } from '@gnosis.pm/zodiac'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SecurityScanner } from './types'
import { ZERO_ADDRESS } from './constants'

/**
 * Detect if a module is a Zodiac Delay Modifier (recovery module) without web3 provider.
 *
 * Layer 1: CGW API enriches known contracts with names — check for "Delay" in name.
 * Layer 2: Match address against known Zodiac Delay Modifier deployments per chain.
 */
const isDelayModifier = (chainId: string, moduleAddress: string, moduleName?: string | null): boolean => {
  // Layer 1: API-provided name
  if (moduleName && moduleName.toLowerCase().includes('delay')) {
    return true
  }

  // Layer 2: Known Zodiac deployment addresses
  try {
    const chainContracts = ContractVersions[Number(chainId) as SupportedNetworks]
    const delayVersions = chainContracts?.[KnownContracts.DELAY]
    if (delayVersions) {
      return Object.values(delayVersions).some((addr) => sameAddress(addr, moduleAddress))
    }
  } catch {
    // Chain not in Zodiac's SupportedNetworks — skip
  }

  return false
}

export const recoveryScanner: SecurityScanner = {
  id: 'recovery',
  scan: async (ctx) => {
    const { chainSupportsRecovery, modules, chainId } = ctx
    const now = new Date().toISOString()

    if (!chainSupportsRecovery) {
      return {
        status: 'not_applicable',
        severity: 'Low',
        score: 100,
        evidence: [{ label: 'Status', value: 'Not available on this network' }],
        remediation: '',
        lastChecked: now,
      }
    }

    const activeModules = (modules ?? []).filter((m) => m.value !== ZERO_ADDRESS)

    // No modules at all — recovery is definitely not configured
    if (activeModules.length === 0) {
      return {
        status: 'issue',
        severity: 'High',
        score: 20,
        evidence: [{ label: 'Status', value: 'No recovery configured' }],
        remediation:
          'If all signers lose access, this Safe cannot be recovered. Set up a recovery mechanism to protect against key loss.',
        lastChecked: now,
      }
    }

    // Check if any module is a known Delay Modifier
    const hasDelayModifier = activeModules.some((m) => isDelayModifier(chainId, m.value, m.name))

    if (hasDelayModifier) {
      return {
        status: 'clear',
        severity: 'Low',
        score: 100,
        evidence: [{ label: 'Status', value: 'Recovery module configured' }],
        remediation: '',
        lastChecked: now,
      }
    }

    // Modules exist but none are a recognized Delay Modifier
    return {
      status: 'partial',
      severity: 'Medium',
      score: 60,
      evidence: [{ label: 'Status', value: 'Recovery not confirmed' }],
      remediation:
        'This Safe has modules installed but none were recognized as a recovery module. Verify that account recovery is configured.',
      lastChecked: now,
    }
  },
}
