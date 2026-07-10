import { ContractVersions, KnownContracts, type SupportedNetworks } from '@gnosis.pm/zodiac'
import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { SecurityScanner } from './types'
import { getSeverityFromScore } from './constants'
import { isSafeAffectedByZodiacVulnerability } from '../../services/vulnerableModules'

/**
 * Module name fragments (case-insensitive) for the Zodiac modules covered by the
 * known security vulnerability. Used to pick which installed module(s) to offer
 * for removal when the security-check API reports the Safe as affected.
 */
const VULNERABLE_MODULE_NAMES = ['delay', 'roles']

const isVulnerableModuleName = (name?: string | null): boolean => {
  if (!name) return false
  const lower = name.toLowerCase()
  return VULNERABLE_MODULE_NAMES.some((fragment) => lower.includes(fragment))
}

/**
 * Known-unsupported Zodiac module mastercopies (lowercased). These mastercopies were
 * enabled directly as modules — the installed module address *is* the mastercopy, not a
 * per-Safe proxy — so we flag them as Critical by address. This is deterministic and does
 * not depend on the server-side Zodiac security-check (which reports these Safes as `safe`)
 * nor on the CGW module name (which comes back `null`).
 *
 * A legitimate Account Recovery Delay Modifier is a per-Safe proxy with a unique address,
 * so it never matches this list. Extend the list as more mastercopies are confirmed.
 */
const UNSUPPORTED_ZODIAC_MASTERCOPIES = new Set(
  [
    '0x01F8cabB808D7dE0dF4202D4B60C8310d2f1339b', // Zodiac Delay Modifier v1.1.0 (same address across chains)
  ].map((address) => address.toLowerCase()),
)

const isUnsupportedZodiacMastercopy = (address: string): boolean =>
  UNSUPPORTED_ZODIAC_MASTERCOPIES.has(address.toLowerCase())

/** Safe Allowance Module deployment versions to check against. */
const ALLOWANCE_MODULE_VERSIONS = ['0.1.0', '0.1.1']

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
 * Name-only variant of the module trust check. Returns true if the module name
 * contains a known fragment (case-insensitive). Exposed so the UI can mark
 * individual modules as trusted without rerunning the full scanner.
 */
export const isKnownModuleByName = (name?: string | null): boolean => {
  if (!name) return false
  const lower = name.toLowerCase()
  return KNOWN_MODULE_NAMES.some((known) => lower.includes(known))
}

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
  for (const version of ALLOWANCE_MODULE_VERSIONS) {
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
  if (isKnownModuleByName(moduleName)) return true

  // Layer 2: Known deployment addresses
  return isKnownZodiacModule(chainId, moduleAddress) || isKnownAllowanceModule(chainId, moduleAddress)
}

export const modulesScanner: SecurityScanner = {
  id: 'modules',
  scan: async (ctx) => {
    const { modules, chainId, safeAddress } = ctx
    const now = new Date().toISOString()

    const activeModules = (modules ?? []).filter((m) => m.value !== ZERO_ADDRESS)

    const moduleLabel = (m: { value: string; name?: string | null }) => m.name || m.value

    // Tier 1: No modules — perfectly fine for most Safes
    if (activeModules.length === 0) {
      const score = 100
      return {
        status: 'not_applicable',
        severity: getSeverityFromScore(score, { excluded: true }),
        score,
        evidence: [{ label: 'Status', value: 'No modules installed' }],
        remediation: '',
        lastChecked: now,
      }
    }

    // Critical: a known-unsupported Zodiac module. Two independent signals, either of which
    // escalates to Critical (always takes precedence over the trust tiers below):
    //   1. Address ruleset — the module is a known-unsupported Zodiac mastercopy. Deterministic;
    //      catches Safes the server-side check reports as `safe` and modules with no CGW name.
    //   2. Server-side Zodiac security-check flags the Safe as affected (also covers the nested
    //      "affected via a related account" case). Fails closed.
    const flaggedByAddress = activeModules.filter((m) => isUnsupportedZodiacMastercopy(m.value))
    const isAffected = await isSafeAffectedByZodiacVulnerability(chainId, safeAddress)
    if (flaggedByAddress.length > 0 || isAffected) {
      // Removable modules on this Safe: address-matched mastercopies plus (when the Safe is
      // affected) any Delay/Roles module matched by name — de-duped so a module caught by both
      // signals is listed once.
      const nameMatched = isAffected ? activeModules.filter((m) => isVulnerableModuleName(m.name)) : []
      const vulnerable = [...flaggedByAddress, ...nameMatched].filter(
        (m, i, arr) => arr.findIndex((o) => sameAddress(o.value, m.value)) === i,
      )
      const score = 0
      const hasRemovable = vulnerable.length > 0
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: hasRemovable
          ? vulnerable.map((m) => ({ label: 'Vulnerable module', value: moduleLabel(m) }))
          : [{ label: 'Status', value: 'Affected by a known Zodiac module vulnerability' }],
        remediation: hasRemovable
          ? 'This Safe has a Zodiac module affected by a known security vulnerability. Remove it immediately to protect your funds.'
          : 'This Safe is affected by a known Zodiac module vulnerability through a related account. Review your setup and remove the affected module.',
        lastChecked: now,
        ctaLabelOverride: hasRemovable ? 'Remove unsupported module' : undefined,
        vulnerableModules: vulnerable.map((m) => m.value),
      }
    }

    const trusted = activeModules.filter((m) => isKnownModule(chainId, m.value, m.name))
    const untrusted = activeModules.filter((m) => !isKnownModule(chainId, m.value, m.name))

    const trustedEvidence = trusted.map((m) => ({ label: 'Trusted module', value: moduleLabel(m) }))
    const untrustedEvidence = untrusted.map((m) => ({ label: 'Unverified module', value: moduleLabel(m) }))

    // Tier 2: All modules are trusted
    if (untrusted.length === 0) {
      const score = 100
      return {
        status: 'clear',
        severity: getSeverityFromScore(score),
        score,
        evidence: trustedEvidence,
        remediation: '',
        lastChecked: now,
      }
    }

    // Tier 3: Mix of trusted and untrusted
    if (trusted.length > 0 && untrusted.length === 1) {
      const score = 50
      return {
        status: 'partial',
        severity: getSeverityFromScore(score),
        score,
        evidence: [...trustedEvidence, ...untrustedEvidence],
        remediation:
          'One installed module could not be verified as a known Safe ecosystem module. Review it in Settings to ensure it is from a trusted source.',
        lastChecked: now,
      }
    }

    // Tier 4: All untrusted, or more than 1 untrusted
    const score = 20
    return {
      status: 'issue',
      severity: getSeverityFromScore(score),
      score,
      evidence: [...trustedEvidence, ...untrustedEvidence],
      remediation:
        'Unverified modules have full control over your Safe and can execute transactions without signer approval. Review and remove any modules you do not recognize.',
      lastChecked: now,
    }
  },
}
