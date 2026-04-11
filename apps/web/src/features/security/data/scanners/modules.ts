import { ContractVersions, KnownContracts, type SupportedNetworks } from '@gnosis.pm/zodiac'
import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SecurityScanner } from './types'
import { ZERO_ADDRESS } from './constants'

/**
 * Known module name fragments (case-insensitive).
 * CGW API enriches known contracts with descriptive names.
 */
const KNOWN_MODULE_NAMES = [
  'delay',
  'allowance',
  'spending limit',
  'roles',
  'scope guard',
  'bridge',
  'reality',
  'optimistic',
  'exit',
  'connext',
]

/**
 * Check if a module address matches a known Zodiac deployment.
 */
const isKnownZodiacModule = (chainId: string, moduleAddress: string): boolean => {
  try {
    const chainContracts = ContractVersions[Number(chainId) as SupportedNetworks]
    if (!chainContracts) return false

    for (const contract of Object.values(KnownContracts)) {
      const versions = chainContracts[contract]
      if (versions && Object.values(versions).some((addr) => sameAddress(addr, moduleAddress))) {
        return true
      }
    }
  } catch {
    // Chain not in Zodiac's SupportedNetworks
  }

  return false
}

/**
 * Check if a module address matches a known Safe Allowance Module deployment.
 */
const isKnownAllowanceModule = (chainId: string, moduleAddress: string): boolean => {
  for (const version of ['0.1.0', '0.1.1']) {
    const deployment = getAllowanceModuleDeployment({ version })
    const addr = deployment?.networkAddresses[chainId]
    if (addr && sameAddress(addr, moduleAddress)) {
      return true
    }
  }
  return false
}

/**
 * Two-layer detection: name from CGW API, then address matching against
 * known Zodiac and Safe module deployments.
 */
const isKnownModule = (chainId: string, moduleAddress: string, moduleName?: string | null): boolean => {
  // Layer 1: API-provided name
  if (moduleName) {
    const lower = moduleName.toLowerCase()
    if (KNOWN_MODULE_NAMES.some((known) => lower.includes(known))) {
      return true
    }
  }

  // Layer 2: Known deployment addresses
  return isKnownZodiacModule(chainId, moduleAddress) || isKnownAllowanceModule(chainId, moduleAddress)
}

export const modulesScanner: SecurityScanner = {
  id: 'modules',
  scan: async (ctx) => {
    const { modules, chainId } = ctx
    const now = new Date().toISOString()

    const activeModules = (modules ?? []).filter((m) => m.value !== ZERO_ADDRESS)

    // Tier 1: No modules — perfectly fine for most Safes
    if (activeModules.length === 0) {
      return {
        status: 'clear',
        severity: 'Low',
        score: 100,
        evidence: [{ label: 'Status', value: 'No modules installed' }],
        remediation: '',
        lastChecked: now,
      }
    }

    const trusted = activeModules.filter((m) => isKnownModule(chainId, m.value, m.name))
    const untrusted = activeModules.filter((m) => !isKnownModule(chainId, m.value, m.name))

    const moduleLabel = (m: { value: string; name?: string | null }) => m.name || `${m.value.slice(0, 10)}...`

    // Tier 2: All modules are trusted
    if (untrusted.length === 0) {
      return {
        status: 'clear',
        severity: 'Low',
        score: 100,
        evidence: trusted.map((m) => ({ label: 'Trusted module', value: moduleLabel(m) })),
        remediation: '',
        lastChecked: now,
      }
    }

    // Tier 3: Mix of trusted and untrusted
    if (trusted.length > 0 && untrusted.length === 1) {
      return {
        status: 'partial',
        severity: 'Medium',
        score: 50,
        evidence: [
          ...trusted.map((m) => ({ label: 'Trusted module', value: moduleLabel(m) })),
          ...untrusted.map((m) => ({ label: 'Unverified module', value: moduleLabel(m) })),
        ],
        remediation:
          'One installed module could not be verified as a known Safe ecosystem module. Review it in Settings to ensure it is from a trusted source.',
        lastChecked: now,
      }
    }

    // Tier 4: All untrusted, or more than 1 untrusted
    return {
      status: 'issue',
      severity: 'High',
      score: 20,
      evidence: [
        ...trusted.map((m) => ({ label: 'Trusted module', value: moduleLabel(m) })),
        ...untrusted.map((m) => ({ label: 'Unverified module', value: moduleLabel(m) })),
      ],
      remediation:
        'Unverified modules have full control over your Safe and can execute transactions without signer approval. Review and remove any modules you do not recognize.',
      lastChecked: now,
    }
  },
}
