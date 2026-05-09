import type { SafeTransaction, SafeSignature, SafeTransactionData } from '@safe-global/types-kit'
import { generateChecksummedAddress, ZERO_ADDRESS } from './addresses'

export interface MockSafeTxOptions {
  to?: string
  value?: string
  data?: string
  operation?: number
  safeTxGas?: string
  baseGas?: string
  gasPrice?: string
  gasToken?: string
  refundReceiver?: string
  nonce?: number
  signatures?: Map<string, SafeSignature>
}

export const createMockSafeTx = (options: MockSafeTxOptions = {}): SafeTransaction => {
  const signatures = options.signatures ?? new Map<string, SafeSignature>()

  const txData: SafeTransactionData = {
    to: options.to ?? generateChecksummedAddress(),
    value: options.value ?? '0',
    data: options.data ?? '0x',
    operation: options.operation ?? 0,
    safeTxGas: options.safeTxGas ?? '0',
    baseGas: options.baseGas ?? '0',
    gasPrice: options.gasPrice ?? '0',
    gasToken: options.gasToken ?? ZERO_ADDRESS,
    refundReceiver: options.refundReceiver ?? ZERO_ADDRESS,
    nonce: options.nonce ?? 0,
  }

  return {
    data: txData,
    signatures,
    addSignature: jest.fn((sig: SafeSignature) => {
      signatures.set(sig.signer, sig)
    }),
    getSignature: jest.fn((signer: string) => signatures.get(signer)),
    encodedSignatures: jest.fn(() => '0x'),
  } as unknown as SafeTransaction
}

export const createMockSafeTxWithSigner = (
  signerAddress: string,
  signatureData: string,
  options: MockSafeTxOptions = {},
): SafeTransaction => {
  const signatures = new Map<string, SafeSignature>()
  signatures.set(signerAddress, { signer: signerAddress, data: signatureData } as SafeSignature)

  return createMockSafeTx({ ...options, signatures })
}
