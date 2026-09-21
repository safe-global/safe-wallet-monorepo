import { identifyOfficialFallbackHandler } from '@safe-global/utils/services/contracts/deployments'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { SecurityScanner } from './types'
import { getSeverityFromScore } from './constants'
// Import directly from helpers/utils (not from '@/features/swap') to avoid pulling
// the swap feature handle (via createFeatureHandle) into the scanner module graph —
// that creates a circular dependency with @/features/__core__ in test environments.
import { TWAP_FALLBACK_HANDLER, TWAP_FALLBACK_HANDLER_NETWORKS } from '@/features/swap/helpers/utils'

type HandlerMatch = 'compatibility' | 'extensible' | 'twap' | null

const identifyFallbackHandler = (address: string, chainId: string): HandlerMatch => {
  const officialHandler = identifyOfficialFallbackHandler(address, chainId)
  if (officialHandler) return officialHandler
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

    const handlerLabel = fallbackHandler.name ?? fallbackHandler.value
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
