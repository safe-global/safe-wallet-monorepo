import { isEIP712TypedData } from '@/utils/safe-messages'
import { normalizeTypedData } from '@/utils/web3'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { generateTypedData } from '@safe-global/protocol-kit/dist/src/utils/eip-712'
import type { EIP712TypedData } from '@safe-global/safe-gateway-typescript-sdk'
import { type SecurityResponse, type SecurityModule, SecuritySeverity } from '../types'
import type {
  AssetDiff,
  ModulesChangeManagement,
  OwnershipChangeManagement,
  ProxyUpgradeManagement,
  TransactionScanResponse,
} from './types'
import { BLOCKAID_API, BLOCKAID_CLIENT_ID } from '@/config/constants'
import { numberToHex } from '@/utils/hex'

/** @see https://docs.blockaid.io/docs/supported-chains */

const blockaidSeverityMap: Record<string, SecuritySeverity> = {
  Malicious: SecuritySeverity.HIGH,
  Warning: SecuritySeverity.MEDIUM,
  Benign: SecuritySeverity.NONE,
  Info: SecuritySeverity.NONE,
}

export type BlockaidModuleRequest = {
  chainId: number
  safeAddress: string
  walletAddress: string
  data: SafeTransaction | EIP712TypedData
  threshold: number
  origin?: string
}

export type BlockaidModuleResponse = {
  description?: string
  classification?: string
  reason?: string
  issues: {
    severity: SecuritySeverity
    description: string
  }[]
  balanceChange: AssetDiff[]
  contractManagement: Array<ProxyUpgradeManagement | OwnershipChangeManagement | ModulesChangeManagement>
  error: Error | undefined
}

type BlockaidPayload = {
  chain: string
  account_address: string
  metadata:
    | {
        domain: string
      }
    | {
        non_dapp: true
      }
  data: {
    method: 'eth_signTypedData_v4'
    params: [string, string]
  }
  options: ['simulation', 'validation']
}

export class BlockaidModule implements SecurityModule<BlockaidModuleRequest, BlockaidModuleResponse> {
  static prepareMessage(request: BlockaidModuleRequest): string {
    const { data, safeAddress, chainId } = request
    if (isEIP712TypedData(data)) {
      const normalizedMsg = normalizeTypedData(data)
      return JSON.stringify(normalizedMsg)
    } else {
      return JSON.stringify(
        generateTypedData({
          safeAddress,
          safeVersion: '1.3.0', // TODO: pass to module, taking into account that lower Safe versions don't have chainId in payload
          chainId: BigInt(chainId),
          data: {
            ...data.data,
            safeTxGas: data.data.safeTxGas,
            baseGas: data.data.baseGas,
            gasPrice: data.data.gasPrice,
          },
        }),
      )
    }
  }
  async scanTransaction(request: BlockaidModuleRequest): Promise<SecurityResponse<BlockaidModuleResponse>> {
    if (!BLOCKAID_CLIENT_ID) {
      throw new Error('Security check CLIENT_ID not configured')
    }

    const { chainId, safeAddress, walletAddress } = request
    const message = BlockaidModule.prepareMessage(request)

    const payload: BlockaidPayload = {
      chain: numberToHex(chainId),
      account_address: walletAddress,
      data: {
        method: 'eth_signTypedData_v4',
        params: [safeAddress, message],
      },
      options: ['simulation', 'validation'],
      metadata: request.origin
        ? {
            domain: request.origin,
          }
        : {
            non_dapp: true,
          },
    }
    const res = await fetch(`${BLOCKAID_API}/v0/evm/json-rpc/scan`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'X-CLIENT-ID': BLOCKAID_CLIENT_ID,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error('Blockaid scan failed', await res.json())
    }

    const result = (await res.json()) as TransactionScanResponse

    const issues = (result.validation?.features ?? [])
      .filter((feature) => feature.type === 'Malicious' || feature.type === 'Warning')
      .map((feature) => ({
        severity: blockaidSeverityMap[feature.type],
        description: feature.description,
      }))

    const simulation = result.simulation
    let balanceChange: AssetDiff[] = []
    let contractManagement: Array<ProxyUpgradeManagement | OwnershipChangeManagement | ModulesChangeManagement> = []
    let error: Error | undefined = undefined
    if (simulation?.status === 'Success') {
      balanceChange = simulation.assets_diffs[safeAddress]
      contractManagement = simulation.contract_management?.[safeAddress] || []
    } else if (simulation?.status === 'Error') {
      error = new Error('Simulation failed')
    }

    // Sometimes the validation is missing
    if (result.validation === undefined) {
      error = new Error('Validation result missing')
    }

    return {
      severity: result.validation?.result_type
        ? blockaidSeverityMap[result.validation.result_type]
        : (SecuritySeverity.NONE ?? SecuritySeverity.NONE),
      payload: {
        description: result.validation?.description,
        classification: result.validation?.classification,
        reason: result.validation?.reason,
        issues,
        balanceChange,
        contractManagement,
        error,
      },
    }
  }
}
