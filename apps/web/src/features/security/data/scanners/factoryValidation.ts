import { getProxyFactoryDeployments } from '@safe-global/safe-deployments'
import { hasMatchingDeployment } from '@safe-global/utils/services/contracts/deployments'
import type { SafeVersion } from '@safe-global/types-kit'
import type { SecurityScanner } from './types'

const KNOWN_VERSIONS: SafeVersion[] = ['1.0.0', '1.1.1', '1.2.0', '1.3.0', '1.4.1']

const isKnownFactory = (address: string, chainId: string): boolean =>
  hasMatchingDeployment(getProxyFactoryDeployments, address, chainId, KNOWN_VERSIONS)

export const factoryValidationScanner: SecurityScanner = {
  id: 'factory_validation',
  scan: async (ctx) => {
    const { creationInfo, chainId } = ctx
    const now = new Date().toISOString()

    if (!creationInfo) {
      return {
        status: 'clear',
        severity: 'Low',
        score: 90,
        evidence: [{ label: 'Status', value: 'Creation data not available' }],
        remediation: '',
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
      status: 'issue',
      severity: 'High',
      score: 20,
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
