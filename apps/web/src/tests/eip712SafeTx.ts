import { TypedDataEncoder } from 'ethers'
import type { SafeTransactionData } from '@safe-global/types-kit'

const SAFE_TX_TYPES = {
  SafeTx: [
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'operation', type: 'uint8' },
    { name: 'safeTxGas', type: 'uint256' },
    { name: 'baseGas', type: 'uint256' },
    { name: 'gasPrice', type: 'uint256' },
    { name: 'gasToken', type: 'address' },
    { name: 'refundReceiver', type: 'address' },
    { name: 'nonce', type: 'uint256' },
  ],
}

/**
 * `safeTxHash` computed with ethers alone, for Safe >= 1.3.0. Deliberately independent of
 * protocol-kit: a test that asserts a hash must not reuse the library that produced it, or a
 * wrong hash input passes both sides.
 */
export const eip712SafeTxHash = (data: SafeTransactionData, chainId: string, safeAddress: string): string =>
  TypedDataEncoder.hash({ chainId: Number(chainId), verifyingContract: safeAddress }, SAFE_TX_TYPES, {
    to: data.to,
    value: data.value,
    data: data.data,
    operation: data.operation,
    safeTxGas: data.safeTxGas,
    baseGas: data.baseGas,
    gasPrice: data.gasPrice,
    gasToken: data.gasToken,
    refundReceiver: data.refundReceiver,
    nonce: data.nonce,
  })
