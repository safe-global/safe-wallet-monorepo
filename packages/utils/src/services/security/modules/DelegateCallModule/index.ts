import { OperationType } from '@safe-global/safe-core-sdk-types'
import { getMultiSendCallOnlyContractDeployment } from '@safe-global/utils/services/contracts/deployments'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { type SafeState as SafeInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

import { SecuritySeverity } from '../types'
import type { SecurityModule, SecurityResponse } from '../types'

type DelegateCallModuleRequest = {
  chain: ChainInfo
  safeVersion: SafeInfo['version']
  safeTransaction: SafeTransaction
}

export type DelegateCallModuleResponse = {
  description: {
    short: string
    long: string
  }
}

export class DelegateCallModule implements SecurityModule<DelegateCallModuleRequest, DelegateCallModuleResponse> {
  private isUnexpectedDelegateCall(request: DelegateCallModuleRequest): boolean {
    const { chain, safeTransaction, safeVersion } = request

    if (safeTransaction.data.operation !== OperationType.DelegateCall) {
      return false
    }

    // We need not check for nested delegate calls as we only use MultiSendCallOnly in the UI
    const multiSendDeployment = getMultiSendCallOnlyContractDeployment(chain, safeVersion)

    return multiSendDeployment?.networkAddresses[chain.chainId] !== safeTransaction.data.to
  }

  async scanTransaction(request: DelegateCallModuleRequest): Promise<SecurityResponse<DelegateCallModuleResponse>> {
    if (!this.isUnexpectedDelegateCall(request)) {
      return {
        severity: SecuritySeverity.NONE,
      }
    }

    return {
      severity: SecuritySeverity.HIGH,
      payload: {
        description: {
          short: 'Unexpected DelegateCall',
          long: 'This transaction is a DelegateCall. It calls a smart contract that will be able to modify your Safe Account.',
        },
      },
    }
  }
}
