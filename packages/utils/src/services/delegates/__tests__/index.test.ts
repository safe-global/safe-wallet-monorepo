import { faker } from '@faker-js/faker'
import { TypedDataEncoder, Wallet, ZeroAddress, verifyTypedData } from 'ethers'
import { chainBuilder } from '../../../tests/builders/chains'
import { FEATURES } from '../../../utils/chains'
import {
  getDelegateTypedData,
  hashDelegateTypedData,
  isQueueServiceDelegateTypedData,
  normalizeDelegateTypedData,
} from '..'

const withoutQueueService = () =>
  faker.helpers.arrayElements(Object.values(FEATURES).filter((feature) => feature !== FEATURES.QUEUE_SERVICE))

const transactionServiceChain = () => chainBuilder().with({ features: withoutQueueService() }).build()

const queueServiceChain = () =>
  chainBuilder()
    .with({ features: [...withoutQueueService(), FEATURES.QUEUE_SERVICE] })
    .build()

describe('delegates', () => {
  const now = Date.now()

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getDelegateTypedData', () => {
    it('builds the transaction service structure on a chain without QUEUE_SERVICE', () => {
      const chain = transactionServiceChain()
      const delegateAddress = faker.finance.ethereumAddress()

      const typedData = getDelegateTypedData(chain, delegateAddress, faker.finance.ethereumAddress(), 'delete')

      expect(typedData).toEqual({
        domain: { name: 'Safe Transaction Service', version: '1.0', chainId: Number(chain.chainId) },
        types: {
          Delegate: [
            { name: 'delegateAddress', type: 'address' },
            { name: 'totp', type: 'uint256' },
          ],
        },
        message: { delegateAddress, totp: Math.floor(now / 1000 / 3600) },
        primaryType: 'Delegate',
      })
      expect(isQueueServiceDelegateTypedData(typedData)).toBe(false)
    })

    it('builds the queue service structure on a chain with QUEUE_SERVICE', () => {
      const chain = queueServiceChain()
      const delegateAddress = faker.finance.ethereumAddress()
      const safe = faker.finance.ethereumAddress()

      const typedData = getDelegateTypedData(chain, delegateAddress, safe, 'delete')

      expect(typedData).toEqual({
        domain: { name: 'Safe Queue Service', version: '1.0', chainId: Number(chain.chainId), safe },
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'safe', type: 'address' },
          ],
          Delegate: [
            { name: 'delegateAddress', type: 'address' },
            { name: 'totp', type: 'uint256' },
            { name: 'action', type: 'string' },
          ],
        },
        message: { delegateAddress, totp: Math.floor(now / 1000 / 3600), action: 'delete' },
        primaryType: 'Delegate',
      })
      expect(isQueueServiceDelegateTypedData(typedData)).toBe(true)
    })

    it('defaults the queue service safe to the zero address and the action to add', () => {
      const typedData = getDelegateTypedData(queueServiceChain(), faker.finance.ethereumAddress())

      expect(typedData.domain).toHaveProperty('safe', ZeroAddress)
      expect(typedData.message).toHaveProperty('action', 'add')
    })
  })

  describe('hashDelegateTypedData', () => {
    it('matches the standard EIP-712 digest for the transaction service structure', () => {
      const typedData = getDelegateTypedData(transactionServiceChain(), faker.finance.ethereumAddress())

      expect(hashDelegateTypedData(typedData)).toBe(
        TypedDataEncoder.hash(typedData.domain, typedData.types, typedData.message),
      )
    })

    it('produces a digest that recovers the signer for the transaction service structure', () => {
      const wallet = new Wallet(faker.string.hexadecimal({ length: 64, casing: 'lower' }))
      const typedData = getDelegateTypedData(transactionServiceChain(), faker.finance.ethereumAddress())

      const signature = wallet.signingKey.sign(hashDelegateTypedData(typedData)).serialized

      expect(verifyTypedData(typedData.domain, typedData.types, typedData.message, signature)).toBe(wallet.address)
    })

    it('hashes the queue service domain including the safe field', () => {
      const chain = queueServiceChain()
      const delegateAddress = faker.finance.ethereumAddress()

      const first = getDelegateTypedData(chain, delegateAddress, faker.finance.ethereumAddress())
      const second = getDelegateTypedData(chain, delegateAddress, faker.finance.ethereumAddress())

      expect(hashDelegateTypedData(first)).not.toBe(hashDelegateTypedData(second))
    })
  })

  describe('normalizeDelegateTypedData', () => {
    it('returns the ethers payload with a numeric chainId for the transaction service structure', () => {
      const typedData = getDelegateTypedData(transactionServiceChain(), faker.finance.ethereumAddress())
      const payload = TypedDataEncoder.getPayload(typedData.domain, typedData.types, typedData.message)

      expect(normalizeDelegateTypedData(typedData)).toEqual({
        ...payload,
        domain: { ...payload.domain, chainId: typedData.domain.chainId },
      })
    })

    it('passes the queue service structure through with a numeric chainId', () => {
      const typedData = getDelegateTypedData(queueServiceChain(), faker.finance.ethereumAddress())

      expect(normalizeDelegateTypedData(typedData)).toEqual({
        types: typedData.types,
        domain: typedData.domain,
        primaryType: 'Delegate',
        message: typedData.message,
      })
    })
  })
})
