import { TypedDataEncoder } from 'ethers'
import { stringifyTypedData } from './walletconnect-signing.service'

// Real ethers (the sibling suite mocks it): the serialized (numeric chainId) typed data must hash
// to the same digest as the original bigint domain, so the wallet signs the hash we computed.
describe('stringifyTypedData is hash-preserving', () => {
  const types = {
    SafeTx: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
  }
  const message = { to: '0x0000000000000000000000000000000000000001', value: '123456789012345678901234567890' }
  const verifyingContract = '0x9a1148b5D6a2D34CA46111379d0FD1352a0ade4a'

  it('serialized (numeric chainId) hashes identically to the original bigint domain', () => {
    const typedData = {
      domain: { chainId: BigInt(137), verifyingContract },
      types: { EIP712Domain: [], ...types },
      primaryType: 'SafeTx',
      message,
    }

    const parsed = JSON.parse(stringifyTypedData(typedData))
    expect(parsed.domain.chainId).toBe(137)

    const originalHash = TypedDataEncoder.hash(typedData.domain, types, message)
    const serializedHash = TypedDataEncoder.hash(parsed.domain, types, parsed.message)
    expect(serializedHash).toBe(originalHash)
  })
})
