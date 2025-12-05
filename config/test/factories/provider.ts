import { generateTxHash } from './addresses'

export interface MockProviderOptions {
  chainId?: bigint | string
  rpcUrl?: string
  blockNumber?: number
  gasPrice?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: number
  gasLimit?: bigint
}

export const createMockProvider = (options: MockProviderOptions = {}) => {
  const chainId = typeof options.chainId === 'string' ? BigInt(options.chainId) : options.chainId ?? BigInt(1)
  const rpcUrl = options.rpcUrl ?? 'https://rpc.example.com'

  return {
    getNetwork: jest.fn().mockResolvedValue({ chainId }),
    _getConnection: jest.fn().mockReturnValue({ url: rpcUrl }),
    getBlockNumber: jest.fn().mockResolvedValue(options.blockNumber ?? 12345678),
    getTransactionCount: jest.fn().mockResolvedValue(options.nonce ?? 0),
    getFeeData: jest.fn().mockResolvedValue({
      gasPrice: options.gasPrice ?? BigInt('1000000000'),
      maxFeePerGas: options.maxFeePerGas ?? BigInt('2000000000'),
      maxPriorityFeePerGas: options.maxPriorityFeePerGas ?? BigInt('1000000000'),
    }),
    estimateGas: jest.fn().mockResolvedValue(options.gasLimit ?? BigInt('21000')),
    broadcastTransaction: jest.fn().mockResolvedValue({ hash: generateTxHash() }),
    getTransaction: jest.fn().mockResolvedValue(null),
    getTransactionReceipt: jest.fn().mockResolvedValue(null),
    call: jest.fn().mockResolvedValue('0x'),
    send: jest.fn().mockResolvedValue('0x'),
  }
}

export type MockProvider = ReturnType<typeof createMockProvider>

export const createMockWeb3ReadOnly = (options: MockProviderOptions = {}) => {
  return createMockProvider(options)
}
