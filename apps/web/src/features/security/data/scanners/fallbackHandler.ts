import { getCompatibilityFallbackHandlerDeployments } from '@safe-global/safe-deployments'
import { hasMatchingDeployment } from '@safe-global/utils/services/contracts/deployments'
import type { SafeVersion } from '@safe-global/types-kit'
import type { SecurityScanner } from './types'
import { ZERO_ADDRESS } from './constants'

// Only 1.3.0+ has the CompatibilityFallbackHandler; older versions used different handler contracts
const HANDLER_VERSIONS: SafeVersion[] = ['1.3.0', '1.4.1']

const isKnownFallbackHandler = (address: string, chainId: string): boolean =>
  hasMatchingDeployment(getCompatibilityFallbackHandlerDeployments, address, chainId, HANDLER_VERSIONS)

export const fallbackHandlerScanner: SecurityScanner = {
  id: 'fallback_handler',
  scan: async (ctx) => {
    const { fallbackHandler, chainId } = ctx
    const now = new Date().toISOString()

    const hasHandler = fallbackHandler !== null && fallbackHandler.value !== ZERO_ADDRESS

    if (!hasHandler) {
      return {
        status: 'clear',
        severity: 'Low',
        score: 100,
        evidence: [{ label: 'Status', value: 'No fallback handler set' }],
        remediation: '',
        lastChecked: now,
      }
    }

    if (isKnownFallbackHandler(fallbackHandler.value, chainId)) {
      return {
        status: 'clear',
        severity: 'Low',
        score: 100,
        evidence: [
          { label: 'Handler', value: fallbackHandler.name ?? `${fallbackHandler.value.slice(0, 10)}...` },
          { label: 'Status', value: 'Official Safe fallback handler' },
        ],
        remediation: '',
        lastChecked: now,
      }
    }

    const handlerLabel = fallbackHandler.name ?? `${fallbackHandler.value.slice(0, 10)}...`
    return {
      status: 'issue',
      severity: 'High',
      score: 20,
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
