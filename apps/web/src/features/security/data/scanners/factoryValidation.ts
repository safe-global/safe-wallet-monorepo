import { getProxyFactoryDeployments } from '@safe-global/safe-deployments'
import { hasMatchingDeployment } from '@safe-global/utils/services/contracts/deployments'
import type { SecurityScanner } from './types'
import { KNOWN_SAFE_VERSIONS, getSeverityFromScore } from './constants'

const isKnownFactory = (address: string, chainId: string): boolean =>
  hasMatchingDeployment(getProxyFactoryDeployments, address, chainId, KNOWN_SAFE_VERSIONS)

export const factoryValidationScanner: SecurityScanner = {
  id: 'factory_validation',
  scan: async (ctx) => {
    const { creationInfo, chainId } = ctx
    const now = new Date().toISOString()

    if (!creationInfo) {
      // Creation transaction data isn't loaded — distinct from "loaded and missing a
      // factory". Return `inconclusive` so we don't penalize the score or label the Safe
      // as deployed from an unrecognized source: we genuinely don't know yet, and the
      // user shouldn't see the result flip between scans once creationTx resolves.
      const score = 50
      return {
        status: 'inconclusive',
        severity: getSeverityFromScore(score, { excluded: true }),
        score,
        evidence: [{ label: 'Status', value: 'Creation data not yet available' }],
        remediation: 'Deployment origin will be verified once creation data loads.',
        lastChecked: now,
      }
    }

    if (!creationInfo.factoryAddress) {
      const score = 60
      return {
        status: 'partial',
        severity: getSeverityFromScore(score),
        score,
        evidence: [{ label: 'Status', value: 'No factory address recorded' }],
        remediation:
          'The deployment factory could not be determined. This may indicate a non-standard deployment method.',
        lastChecked: now,
      }
    }

    if (isKnownFactory(creationInfo.factoryAddress, chainId)) {
      const score = 100
      return {
        status: 'clear',
        severity: getSeverityFromScore(score),
        score,
        evidence: [
          { label: 'Factory', value: creationInfo.factoryAddress },
          { label: 'Status', value: 'Official Safe factory' },
        ],
        remediation: '',
        lastChecked: now,
      }
    }

    const score = 60
    return {
      status: 'partial',
      severity: getSeverityFromScore(score),
      score,
      evidence: [
        { label: 'Factory', value: creationInfo.factoryAddress },
        { label: 'Status', value: 'Unrecognized factory' },
      ],
      remediation:
        'This Safe was not deployed via a recognized Safe proxy factory. It may have been created through an unofficial or modified deployment process.',
      lastChecked: now,
    }
  },
}
