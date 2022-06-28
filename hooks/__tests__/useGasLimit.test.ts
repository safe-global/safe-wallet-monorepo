import { SafeSignature, SafeTransaction } from '@gnosis.pm/safe-core-sdk-types'
import { _encodeSignatures } from '../useGasLimit'

const createSafeTx = (): SafeTransaction => {
  return {
    data: {
      to: '0x0000000000000000000000000000000000000000',
      value: '0x0',
      data: '0x',
      operation: 0,
    },
    signatures: new Map([]),
    addSignature: function (sig: SafeSignature) {
      this.signatures.set(sig.signer, sig)
    },
    encodedSignatures: function () {
      return Object.values(Object.fromEntries(this.signatures))
        .map((sig: SafeSignature) => {
          return [sig.signer, sig.data].join(' = ')
        })
        .join('; ')
    },
  } as SafeTransaction
}

describe('encodeSignatures', () => {
  it('should encode signatures from a fully signed tx', async () => {
    const safeTx = createSafeTx()

    safeTx.addSignature({
      signer: '0x123',
      data: '0xEEE',
      staticPart: () => '0xEEE',
      dynamicPart: () => '',
    })

    safeTx.addSignature({
      signer: '0x345',
      data: '0xAAA',
      staticPart: () => '0xAAA',
      dynamicPart: () => '',
    })

    const owner = '0x123'

    const encoded = _encodeSignatures(safeTx, owner)

    expect(safeTx?.signatures.size).toBe(2)
    expect(encoded).toBe('0x123 = 0xEEE; 0x345 = 0xAAA')
  })

  it('should encode signatures with an extra owner signature', async () => {
    const safeTx = createSafeTx()

    safeTx.addSignature({
      signer: '0x345',
      data: '0xAAA',
      staticPart: () => '0xAAA',
      dynamicPart: () => '',
    })

    const owner = '0x123'

    const encoded = _encodeSignatures(safeTx, owner)

    expect(safeTx?.signatures.size).toBe(1)
    expect(encoded).toBe(
      '0x345 = 0xAAA; 0x123 = 0x000000000000000000000000123000000000000000000000000000000000000000000000000000000000000000001',
    )
  })
})
