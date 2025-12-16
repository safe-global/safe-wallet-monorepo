import { faker } from '@faker-js/faker'

/**
 * Generates a mock transaction signature (hex-encoded)
 * Format: 0x + 130 hex characters (65 bytes: r + s + v)
 */
export function generateTransactionSignature(): string {
  return `0x${faker.string.hexadecimal({ length: 130, prefix: '' })}`
}

/**
 * Generates a mock Safe transaction hash
 * Format: 0x + 64 hex characters (32 bytes)
 */
export function generateSafeTxHash(): string {
  return `0x${faker.string.hexadecimal({ length: 64, prefix: '' })}`
}

/**
 * Generates a mock Ethereum address
 * Format: 0x + 40 hex characters (20 bytes)
 */
export function generateAddress(): string {
  return faker.finance.ethereumAddress()
}

/**
 * Generates a mock transaction ID (UUID format)
 */
export function generateTxId(): string {
  return faker.string.uuid()
}

/**
 * Generates a complete mock transaction context for testing
 */
export function generateMockTransaction() {
  return {
    txId: generateTxId(),
    safeTxHash: generateSafeTxHash(),
    to: generateAddress(),
    value: faker.number.bigInt({ min: 0n, max: 1000000000000000000n }).toString(),
    data: `0x${faker.string.hexadecimal({ length: 64, prefix: '' })}`,
    operation: 0 as const,
    gasToken: generateAddress(),
    safeTxGas: faker.number.int({ min: 21000, max: 500000 }).toString(),
    baseGas: faker.number.int({ min: 21000, max: 100000 }).toString(),
    gasPrice: faker.number.bigInt({ min: 1000000000n, max: 100000000000n }).toString(),
    refundReceiver: generateAddress(),
    nonce: faker.number.int({ min: 0, max: 1000 }),
    submissionDate: faker.date.recent().toISOString(),
  }
}

/**
 * Generates a mock signer for testing
 */
export function generateMockSigner(type: 'seed' | 'private_key' | 'ledger' = 'seed') {
  const signer = {
    type,
    value: generateAddress(),
  }

  if (type === 'ledger') {
    return {
      ...signer,
      derivationPath: `m/44'/60'/0'/0/${faker.number.int({ min: 0, max: 10 })}`,
    }
  }

  return signer
}
