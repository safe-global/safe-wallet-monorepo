import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { TransactionStatus } from '@safe-global/safe-gateway-typescript-sdk'
import type { TransactionReceipt } from 'ethers'
import { numberToHex } from '@/utils/hex'

type SafeInfo = {
  safeAddress: string
  chainId: number
}

type SafeSettings = {
  offChainSigning?: boolean
}

type Capability = {
  [key: string]: unknown
  optional?: boolean
}

type SendCallsParams = {
  version: '1.0'
  id?: string
  from?: `0x${string}`
  chainId: `0x${string}`
  calls: Array<{
    to?: `0x${string}`
    data?: `0x${string}`
    value?: `0x${string}`
    capabilities?: Record<string, Capability>
  }>
  capabilities?: Record<string, Capability>
}

type SendCallsResult = {
  id: string
  capabilities?: Record<string, any>
}

type GetCallsParams = `0x${string}`

type GetCallsResult = {
  version: string
  id: `0x${string}`
  chainId: `0x${string}`
  status: number // See "Status Codes"
  receipts?: Array<{
    logs: TransactionReceipt['logs']
    status: `0x${string}` // Hex 1 or 0 for success or failure, respectively
    blockHash: `0x${string}`
    blockNumber: `0x${string}`
    gasUsed: `0x${string}`
    transactionHash: `0x${string}`
  }>
  capabilities?: Record<string, any>
}

type GetCapabilitiesResult = Record<`0x${string}`, Record<string, any>>

export type AppInfo = {
  id?: number
  name: string
  description: string
  url: string
  iconUrl: string
}

export type WalletSDK = {
  signMessage: (message: string, appInfo: AppInfo) => Promise<{ signature?: string }>
  signTypedMessage: (typedData: unknown, appInfo: AppInfo) => Promise<{ signature?: string }>
  send: (
    params: { txs: unknown[]; params: { safeTxGas: number } },
    appInfo: AppInfo,
  ) => Promise<{ safeTxHash: string; txHash?: string }>
  getBySafeTxHash: (safeTxHash: string) => Promise<TransactionDetails>
  showTxStatus: (safeTxHash: string) => void
  switchChain: (chainId: string, appInfo: AppInfo) => Promise<null>
  setSafeSettings: (safeSettings: SafeSettings) => SafeSettings
  proxy: (method: string, params?: Array<any> | Record<string, any>) => Promise<unknown>
  getCreateCallTransaction: (data: string) => {
    to: string
    data: string
    value: '0'
  }
}

interface RpcRequest {
  method: string
  params?: Array<any> | Record<string, any>
}

export enum RpcErrorCode {
  INVALID_PARAMS = -32602,
  USER_REJECTED = 4001,
  UNSUPPORTED_METHOD = 4200,
  UNSUPPORTED_CHAIN = 4901,
}

enum BundleStatus {
  PENDING = 100, // Batch has been received by the wallet but has not completed execution onchain (pending)
  CONFIRMED = 200, // Batch has been included onchain without reverts, receipts array contains info of all calls (confirmed)
  OFFCHAIN_FAILURE = 400, // Batch has not been included onchain and wallet will not retry (offchain failure)
  REVERTED = 500, // Batch reverted completely and only changes related to gas charge may have been included onchain (chain rules failure)
  PARTIALLY_REVERTED = 600, // Batch reverted partially and some changes related to batch calls may have been included onchain (partial chain rules failure)
}

const BundleTxStatuses: Record<TransactionStatus, BundleStatus> = {
  [TransactionStatus.AWAITING_CONFIRMATIONS]: BundleStatus.PENDING,
  [TransactionStatus.AWAITING_EXECUTION]: BundleStatus.PENDING,
  [TransactionStatus.SUCCESS]: BundleStatus.CONFIRMED,
  [TransactionStatus.CANCELLED]: BundleStatus.OFFCHAIN_FAILURE,
  [TransactionStatus.FAILED]: BundleStatus.REVERTED,
}

class RpcError extends Error {
  code: RpcErrorCode

  constructor(code: RpcErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export class SafeWalletProvider {
  private readonly safe: SafeInfo
  private readonly sdk: WalletSDK
  private submittedTxs = new Map<string, unknown>()

  constructor(safe: SafeInfo, sdk: WalletSDK) {
    this.safe = safe
    this.sdk = sdk
  }

  private async makeRequest(request: RpcRequest, appInfo: AppInfo): Promise<unknown> {
    const { method, params = [] } = request

    switch (method) {
      case 'wallet_switchEthereumChain': {
        return this.wallet_switchEthereumChain(...(params as [{ chainId: string }]), appInfo)
      }

      case 'eth_accounts':
      case 'eth_requestAccounts': {
        return this.eth_accounts()
      }

      case 'net_version':
      case 'eth_chainId': {
        return this.eth_chainId()
      }

      case 'personal_sign': {
        return this.personal_sign(...(params as [string, string]), appInfo)
      }

      case 'eth_sign': {
        return this.eth_sign(...(params as [string, string]), appInfo)
      }

      case 'eth_signTypedData':
      case 'eth_signTypedData_v4': {
        return this.eth_signTypedData(...(params as [string, unknown]), appInfo)
      }

      case 'eth_sendTransaction': {
        const tx = {
          value: '0',
          data: '0x',
          // @ts-ignore
          ...(params[0] as { gas: string | number; to: string }),
        }
        return this.eth_sendTransaction(tx, appInfo)
      }

      case 'eth_getTransactionByHash': {
        return this.eth_getTransactionByHash(...(params as [string]))
      }

      case 'eth_getTransactionReceipt': {
        return this.eth_getTransactionReceipt(...(params as [string]))
      }

      // EIP-5792
      // @see https://eips.ethereum.org/EIPS/eip-5792
      case 'wallet_sendCalls': {
        return this.wallet_sendCalls(...(params as [SendCallsParams]), appInfo)
      }

      case 'wallet_getCallsStatus': {
        return this.wallet_getCallsStatus(...(params as [GetCallsParams]))
      }

      case 'wallet_showCallsStatus': {
        this.wallet_showCallsStatus(...(params as [string]))
        return null
      }

      case 'wallet_getCapabilities': {
        return this.wallet_getCapabilities(...(params as [string]))
      }

      // Safe proprietary methods
      case 'safe_setSettings': {
        return this.safe_setSettings(...(params as [SafeSettings]))
      }

      default: {
        return await this.sdk.proxy(method, params)
      }
    }
  }

  async request(
    id: number,
    request: RpcRequest,
    appInfo: AppInfo,
  ): Promise<
    | {
        jsonrpc: string
        id: number
        result: unknown
      }
    | {
        jsonrpc: string
        id: number
        error: {
          code: number
          message: string
        }
      }
  > {
    try {
      return {
        jsonrpc: '2.0',
        id,
        result: await this.makeRequest(request, appInfo),
      }
    } catch (e) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message: (e as Error).message,
        },
      }
    }
  }

  // Actual RPC methods

  async wallet_switchEthereumChain({ chainId }: { chainId: string }, appInfo: AppInfo) {
    try {
      await this.sdk.switchChain(chainId, appInfo)
    } catch (e) {
      throw new RpcError(RpcErrorCode.UNSUPPORTED_CHAIN, 'Unsupported chain')
    }
    return null
  }

  async eth_accounts() {
    return [this.safe.safeAddress]
  }

  async eth_chainId() {
    return `0x${this.safe.chainId.toString(16)}`
  }

  async personal_sign(message: string, address: string, appInfo: AppInfo): Promise<string> {
    if (this.safe.safeAddress.toLowerCase() !== address.toLowerCase()) {
      throw new RpcError(RpcErrorCode.INVALID_PARAMS, 'The address or message hash is invalid')
    }

    const response = await this.sdk.signMessage(message, appInfo)
    const signature = 'signature' in response ? response.signature : undefined

    return signature || '0x'
  }

  async eth_sign(address: string, messageHash: string, appInfo: AppInfo): Promise<string> {
    if (this.safe.safeAddress.toLowerCase() !== address.toLowerCase() || !messageHash.startsWith('0x')) {
      throw new RpcError(RpcErrorCode.INVALID_PARAMS, 'The address or message hash is invalid')
    }

    const response = await this.sdk.signMessage(messageHash, appInfo)
    const signature = 'signature' in response ? response.signature : undefined

    return signature || '0x'
  }

  async eth_signTypedData(address: string, typedData: unknown, appInfo: AppInfo): Promise<string> {
    const parsedTypedData = typeof typedData === 'string' ? JSON.parse(typedData) : typedData

    if (this.safe.safeAddress.toLowerCase() !== address.toLowerCase()) {
      throw new RpcError(RpcErrorCode.INVALID_PARAMS, 'The address is invalid')
    }

    const response = await this.sdk.signTypedMessage(parsedTypedData, appInfo)
    const signature = 'signature' in response ? response.signature : undefined
    return signature || '0x'
  }

  async eth_sendTransaction(
    tx: { gas: string | number; to: string; value: string; data: string },
    appInfo: AppInfo,
  ): Promise<string> {
    // Some ethereum libraries might pass the gas as a hex-encoded string
    // We need to convert it to a number because the SDK expects a number and our backend only supports
    // Decimal numbers
    if (typeof tx.gas === 'string' && tx.gas.startsWith('0x')) {
      tx.gas = parseInt(tx.gas, 16)
    }

    const { safeTxHash, txHash } = await this.sdk.send(
      {
        txs: [tx],
        params: { safeTxGas: Number(tx.gas) },
      },
      appInfo,
    )

    if (txHash) return txHash

    // Store fake transaction
    this.submittedTxs.set(safeTxHash, {
      from: this.safe.safeAddress,
      hash: safeTxHash,
      gas: 0,
      gasPrice: '0x00',
      nonce: 0,
      input: tx.data,
      value: tx.value,
      to: tx.to,
      blockHash: null,
      blockNumber: null,
      transactionIndex: null,
    })

    return safeTxHash
  }

  async eth_getTransactionByHash(txHash: string): Promise<TransactionDetails> {
    try {
      const resp = await this.sdk.getBySafeTxHash(txHash)
      txHash = resp.txHash || txHash
    } catch (e) {}

    // Use fake transaction if we don't have a real tx hash
    if (this.submittedTxs.has(txHash)) {
      return this.submittedTxs.get(txHash) as TransactionDetails
    }

    return (await this.sdk.proxy('eth_getTransactionByHash', [txHash])) as Promise<TransactionDetails>
  }

  async eth_getTransactionReceipt(txHash: string): Promise<TransactionReceipt> {
    try {
      const resp = await this.sdk.getBySafeTxHash(txHash)
      txHash = resp.txHash || txHash
    } catch (e) {}
    return this.sdk.proxy('eth_getTransactionReceipt', [txHash]) as Promise<TransactionReceipt>
  }

  // EIP-5792
  // @see https://eips.ethereum.org/EIPS/eip-5792
  async wallet_sendCalls(bundle: SendCallsParams, appInfo: AppInfo): Promise<SendCallsResult> {
    if (bundle.chainId !== numberToHex(this.safe.chainId)) {
      throw new Error(`Safe is not on chain ${this.safe.chainId}`)
    }

    if (bundle.from !== this.safe.safeAddress) {
      throw Error('Invalid from address')
    }

    const txs = bundle.calls.map((call) => {
      if (!call.to && !call.value && !call.data) {
        throw new RpcError(RpcErrorCode.INVALID_PARAMS, 'Invalid call parameters.')
      }
      if (!call.to && !call.value && call.data) {
        // If only data is provided the call is a contract deployment
        // We have to use the CreateCall lib
        return this.sdk.getCreateCallTransaction(call.data)
      }
      if (!call.to) {
        // For all non-contract deployments we need a to address
        throw new RpcError(RpcErrorCode.INVALID_PARAMS, 'Invalid call parameters.')
      }
      return {
        to: call.to,
        data: call.data ?? '0x',
        value: call.value ?? '0',
      }
    })
    const { safeTxHash } = await this.sdk.send(
      {
        txs,
        params: { safeTxGas: 0 },
      },
      appInfo,
    )

    return { id: safeTxHash }
  }
  async wallet_getCallsStatus(safeTxHash: GetCallsParams): Promise<GetCallsResult> {
    let tx: TransactionDetails | undefined

    try {
      tx = await this.sdk.getBySafeTxHash(safeTxHash)
    } catch (e) {}

    if (!tx) {
      throw new Error('Transaction not found')
    }

    const result: GetCallsResult = {
      version: '1.0',
      id: safeTxHash,
      chainId: numberToHex(this.safe.chainId),
      status: BundleTxStatuses[tx.txStatus],
    }

    if (!tx.txHash) {
      return result
    }

    const receipt = await (this.sdk.proxy('eth_getTransactionReceipt', [
      tx.txHash,
    ]) as Promise<TransactionReceipt | null>)
    if (!receipt) {
      return result
    }

    const calls = tx.txData?.dataDecoded?.parameters?.[0].valueDecoded?.length ?? 1

    // Typed as number; is hex
    const blockNumber = Number(receipt.blockNumber)
    const gasUsed = Number(receipt.gasUsed)

    result.receipts = Array.from({ length: calls }, () => ({
      logs: receipt.logs,
      status: numberToHex(tx.txStatus === TransactionStatus.SUCCESS ? 1 : 0),
      blockHash: receipt.blockHash as `0x${string}`,
      blockNumber: numberToHex(blockNumber),
      gasUsed: numberToHex(gasUsed),
      transactionHash: tx.txHash as `0x${string}`,
    }))

    return result
  }
  async wallet_showCallsStatus(txHash: string): Promise<null> {
    this.sdk.showTxStatus(txHash)
    return null
  }

  async wallet_getCapabilities(walletAddress: string): Promise<GetCapabilitiesResult> {
    if (walletAddress === this.safe.safeAddress) {
      return {
        [`0x${this.safe.chainId.toString(16)}`]: {
          atomicBatch: {
            supported: true,
          },
        },
      }
    }
    return {}
  }

  // Safe proprietary methods
  async safe_setSettings(settings: SafeSettings): Promise<SafeSettings> {
    return this.sdk.setSafeSettings(settings)
  }
}
