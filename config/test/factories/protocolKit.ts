import { generateChecksummedAddress, generateTxHash } from './addresses'

export interface MockProtocolKitOptions {
  address?: string
  threshold?: number
  owners?: string[]
  nonce?: number
  version?: string
}

export const createMockProtocolKit = (options: MockProtocolKitOptions = {}) => ({
  createTransaction: jest.fn(),
  signTransaction: jest.fn(),
  executeTransaction: jest.fn(),
  getTransactionHash: jest.fn().mockResolvedValue(generateTxHash()),
  getThreshold: jest.fn().mockResolvedValue(options.threshold ?? 1),
  getOwners: jest.fn().mockResolvedValue(options.owners ?? [generateChecksummedAddress()]),
  getOwnersWhoApprovedTx: jest.fn().mockResolvedValue([]),
  getEncodedTransaction: jest.fn().mockResolvedValue('0x'),
  getAddress: jest.fn().mockResolvedValue(options.address ?? generateChecksummedAddress()),
  getNonce: jest.fn().mockResolvedValue(options.nonce ?? 0),
  getContractVersion: jest.fn().mockResolvedValue(options.version ?? '1.3.0'),
})

export type MockProtocolKit = ReturnType<typeof createMockProtocolKit>

export const createMockSafeSDK = (options: MockProtocolKitOptions = {}) => {
  return createMockProtocolKit(options)
}
