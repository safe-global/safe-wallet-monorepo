import {
  getCompatibilityFallbackHandlerDeployments,
  getExtensibleFallbackHandlerDeployments,
} from '@safe-global/safe-deployments'
import { hasMatchingDeployment } from '@safe-global/utils/services/contracts/deployments'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { SafeVersion } from '@safe-global/types-kit'
import type { SecurityScanner } from './types'
import { getSeverityFromScore } from './constants'
// Import directly from helpers/utils (not from '@/features/swap') to avoid pulling
// the swap feature handle (via createFeatureHandle) into the scanner module graph —
// that creates a circular dependency with @/features/__core__ in test environments.
import { TWAP_FALLBACK_HANDLER, TWAP_FALLBACK_HANDLER_NETWORKS } from '@/features/swap/helpers/utils'

// Only 1.3.0+ has the CompatibilityFallbackHandler; older versions used different handler contracts
const COMPATIBILITY_HANDLER_VERSIONS: SafeVersion[] = ['1.3.0', '1.4.1']

/** Check if address matches an ExtensibleFallbackHandler deployment (v1.5.0+, not in SafeVersion type yet). */
const isExtensibleFallbackHandler = (address: string, chainId: string): boolean => {
  const deployment = getExtensibleFallbackHandlerDeployments()
  if (!deployment) return false
  const addresses = deployment.networkAddresses[chainId]
  if (!addresses) return false
  const addrList = Array.isArray(addresses) ? addresses : [addresses]
  return addrList.some((a) => sameAddress(a, address))
}

type HandlerMatch = 'compatibility' | 'extensible' | 'twap' | null

const identifyFallbackHandler = (address: string, chainId: string): HandlerMatch => {
  if (
    hasMatchingDeployment(getCompatibilityFallbackHandlerDeployments, address, chainId, COMPATIBILITY_HANDLER_VERSIONS)
  )
    return 'compatibility'
  if (isExtensibleFallbackHandler(address, chainId)) return 'extensible'
  if (TWAP_FALLBACK_HANDLER_NETWORKS.includes(chainId) && sameAddress(address, TWAP_FALLBACK_HANDLER)) return 'twap'
  return null
}

const HANDLER_LABELS: Record<Exclude<HandlerMatch, null>, string> = {
  compatibility: 'Official Safe fallback handler',
  extensible: 'Official Safe extensible fallback handler',
  twap: 'CoW Protocol TWAP handler',
}

export const fallbackHandlerScanner: SecurityScanner = {
  id: 'fallback_handler',
  scan: async (ctx) => {
    const { fallbackHandler, chainId } = ctx
    const now = new Date().toISOString()

    const hasHandler = fallbackHandler !== null && fallbackHandler.value !== ZERO_ADDRESS

    if (!hasHandler) {
      const score = 100
      return {
        status: 'clear',
        severity: getSeverityFromScore(score),
        score,
        evidence: [{ label: 'Status', value: 'No fallback handler set' }],
        remediation: '',
        lastChecked: now,
      }
    }

    const handlerLabel = fallbackHandler.name ?? `${fallbackHandler.value.slice(0, 10)}...`
    const match = identifyFallbackHandler(fallbackHandler.value, chainId)

    if (match) {
      const score = 100
      return {
        status: 'clear',
        severity: getSeverityFromScore(score),
        score,
        evidence: [
          { label: 'Handler', value: handlerLabel },
          { label: 'Status', value: HANDLER_LABELS[match] },
        ],
        remediation: '',
        lastChecked: now,
      }
    }

    const score = 20
    return {
      status: 'issue',
      severity: getSeverityFromScore(score),
      score,
      evidence: [
        { label: 'Handler', value: handlerLabel },
        { label: 'Status', value: 'Unrecognized fallback handler' },
      ],
      remediation:
        'The fallback handler is not a recognized Safe deployment. An untrusted handler can intercept calls to the Safe. Review it in Settings to ensure it is legitimate.',
      lastChecked: now,
    }
  },
}
