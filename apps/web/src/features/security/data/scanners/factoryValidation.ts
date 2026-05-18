import { getProxyFactoryDeployments } from '@safe-global/safe-deployments'
import { hasMatchingDeployment } from '@safe-global/utils/services/contracts/deployments'
import type { SecurityScanner } from './types'
import { KNOWN_SAFE_VERSIONS } from './constants'

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
      return {
        status: 'inconclusive',
        severity: 'Low',
        score: 50,
        evidence: [{ label: 'Status', value: 'Creation data not yet available' }],
        remediation: 'Deployment origin will be verified once creation data loads.',
        lastChecked: now,
      }
    }

    if (!creationInfo.factoryAddress) {
      return {
        status: 'partial',
        severity: 'Medium',
        score: 60,
        evidence: [{ label: 'Status', value: 'No factory address recorded' }],
        remediation:
          'The deployment factory could not be determined. This may indicate a non-standard deployment method.',
        lastChecked: now,
      }
    }

    if (isKnownFactory(creationInfo.factoryAddress, chainId)) {
      return {
        status: 'clear',
        severity: 'Low',
        score: 100,
        evidence: [
          { label: 'Factory', value: `${creationInfo.factoryAddress.slice(0, 10)}...` },
          { label: 'Status', value: 'Official Safe factory' },
        ],
        remediation: '',
        lastChecked: now,
      }
    }

    return {
      status: 'partial',
      severity: 'Medium',
      score: 60,
      evidence: [
        { label: 'Factory', value: `${creationInfo.factoryAddress.slice(0, 10)}...` },
        { label: 'Status', value: 'Unrecognized factory' },
      ],
      remediation:
        'This Safe was not deployed via a recognized Safe proxy factory. It may have been created through an unofficial or modified deployment process.',
      lastChecked: now,
    }
  },
}
