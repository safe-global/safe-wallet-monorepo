import { faker } from '@faker-js/faker'
import { Interface, Wallet, ZeroAddress, concat, getAddress, toBeHex } from 'ethers'
import type { CosignatureDto, CosignerTransactionDto } from '@safe-global/store/cosigner/cosignerApi.dto'
import { ERC1271_ABI, ERC1271_MAGIC_VALUE } from '../constants'
import { evaluateCosignatures, hasZeroGasFields, isValidCosignature } from '../cosignature'
import type { EthCall } from '../requirement'

const randomAddress = () => getAddress(faker.finance.ethereumAddress())
const randomWallet = () => new Wallet(faker.string.hexadecimal({ length: 64, casing: 'lower' }))

const randomHash = () => faker.string.hexadecimal({ length: 64, casing: 'lower' })
const erc1271 = new Interface(ERC1271_ABI)

const buildEntry = (overrides: Partial<CosignatureDto> = {}): CosignatureDto => ({
  cosignerName: 'SAFE',
  status: 'PENDING',
  ruleId: null,
  reason: null,
  signature: null,
  decidedAt: null,
  ...overrides,
})

const buildResult = (signatures: CosignatureDto[]): CosignerTransactionDto => ({
  chainId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
  safeAddress: faker.finance.ethereumAddress(),
  safeTxHash: randomHash(),
  signatures,
})

const signedEntry = (signer: string, data: string): CosignatureDto =>
  buildEntry({ status: 'SIGNED', signature: { signer, data }, decidedAt: faker.date.recent().toISOString() })

const ecdsaSignature = () => concat([randomHash(), randomHash(), toBeHex(27, 1)])

describe('cosignature', () => {
  describe('evaluateCosignatures', () => {
    const cosigner = randomAddress()

    it('reports not found when the service has not seen the transaction', () => {
      expect(evaluateCosignatures({ notFound: true }, cosigner)).toEqual({ status: 'notFound' })
    })

    it('returns the context of the signature from the configured co-signer', () => {
      const data = ecdsaSignature()

      const outcome = evaluateCosignatures(buildResult([signedEntry(cosigner.toLowerCase(), data)]), cosigner)

      expect(outcome).toEqual({
        status: 'ready',
        context: data,
        onchain: false,
        signer: cosigner.toLowerCase(),
        cosignerName: 'SAFE',
      })
    })

    it('keeps waiting while a co-signer is pending even if another rejected', () => {
      const result = buildResult([
        buildEntry({ status: 'REJECTED', reason: 'limit' }),
        buildEntry({ status: 'PENDING' }),
      ])

      expect(evaluateCosignatures(result, cosigner)).toEqual({ status: 'pending' })
    })

    it('reports the rejection reason and rule once no co-signer is pending', () => {
      const result = buildResult([
        buildEntry({ status: 'REJECTED', reason: 'Transfer above limit', ruleId: 'rule_abcd1234' }),
      ])

      expect(evaluateCosignatures(result, cosigner)).toEqual({
        status: 'rejected',
        reason: 'Transfer above limit',
        ruleId: 'rule_abcd1234',
        cosignerName: 'SAFE',
      })
    })

    it('reports a failed evaluation', () => {
      const result = buildResult([buildEntry({ status: 'FAILED', reason: 'RPC unavailable' })])

      expect(evaluateCosignatures(result, cosigner)).toMatchObject({ status: 'failed', reason: 'RPC unavailable' })
    })

    it('rejects a signature from a signer other than the configured co-signer', () => {
      const result = buildResult([signedEntry(randomAddress(), ecdsaSignature())])

      expect(evaluateCosignatures(result, cosigner)).toMatchObject({ status: 'invalid' })
    })

    it('rejects an eth_sign co-signature', () => {
      const data = concat([randomHash(), randomHash(), toBeHex(31, 1)])

      expect(evaluateCosignatures(buildResult([signedEntry(cosigner, data)]), cosigner)).toMatchObject({
        status: 'invalid',
      })
    })
  })

  describe('hasZeroGasFields', () => {
    const zeroGas = { safeTxGas: '0', baseGas: '0', gasPrice: '0', gasToken: ZeroAddress, refundReceiver: ZeroAddress }

    it('accepts a transaction with every gas field zeroed', () => {
      expect(hasZeroGasFields(zeroGas)).toBe(true)
    })

    it.each([
      ['safeTxGas', { safeTxGas: '21000' }],
      ['baseGas', { baseGas: '1' }],
      ['gasPrice', { gasPrice: '1' }],
      ['gasToken', { gasToken: faker.finance.ethereumAddress() }],
      ['refundReceiver', { refundReceiver: faker.finance.ethereumAddress() }],
    ])('rejects a transaction with a non-zero %s', (_, override) => {
      expect(hasZeroGasFields({ ...zeroGas, ...override })).toBe(false)
    })
  })

  describe('isValidCosignature', () => {
    const unusedCall: EthCall = () => Promise.reject(new Error('unexpected call'))

    it('accepts an ECDSA co-signature over the safeTxHash by the co-signer', async () => {
      const wallet = randomWallet()
      const safeTxHash = randomHash()
      const signature = wallet.signingKey.sign(safeTxHash).serialized

      expect(await isValidCosignature(unusedCall, wallet.address, safeTxHash, signature)).toBe(true)
    })

    it('accepts an on-chain approval the co-signer contract confirms through ERC-1271', async () => {
      const cosigner = randomAddress()
      const safeTxHash = randomHash()
      const call: EthCall = async () => erc1271.encodeFunctionResult('isValidSignature', [ERC1271_MAGIC_VALUE])

      expect(await isValidCosignature(call, cosigner, safeTxHash, '0x')).toBe(true)
    })

    it('rejects an on-chain approval that the co-signer contract does not confirm', async () => {
      const cosigner = randomAddress()
      const call: EthCall = async () => erc1271.encodeFunctionResult('isValidSignature', ['0xffffffff'])

      expect(await isValidCosignature(call, cosigner, randomHash(), '0x')).toBe(false)
    })

    it('rejects an ECDSA signature by another key when the co-signer has no code', async () => {
      const safeTxHash = randomHash()
      const signature = randomWallet().signingKey.sign(safeTxHash).serialized
      const call: EthCall = async () => '0x'

      expect(await isValidCosignature(call, randomAddress(), safeTxHash, signature)).toBe(false)
    })
  })
})
