import { faker } from '@faker-js/faker'
import { Wallet, recoverAddress, verifyTypedData } from 'ethers'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { getDelegateTypedData, hashDelegateTypedData } from '@safe-global/utils/services/delegates'
import { chainBuilder } from '@/tests/builders/chains'
import { signTypedData } from './signTypedData'

describe('signTypedData', () => {
  it('signs queue service delegate typed data despite its non-standard domain', async () => {
    const wallet = new Wallet(faker.string.hexadecimal({ length: 64, casing: 'lower' }))
    const chain = chainBuilder()
      .with({ features: [FEATURES.QUEUE_SERVICE] })
      .build()
    const typedData = getDelegateTypedData(chain, faker.finance.ethereumAddress(), faker.finance.ethereumAddress())

    const signature = await signTypedData(wallet, typedData)

    expect(recoverAddress(hashDelegateTypedData(typedData), signature)).toBe(wallet.address)
  })

  it('signs other typed data with the standard EIP-712 encoding', async () => {
    const wallet = new Wallet(faker.string.hexadecimal({ length: 64, casing: 'lower' }))
    const chain = chainBuilder().with({ features: [] }).build()
    const typedData = getDelegateTypedData(chain, faker.finance.ethereumAddress())

    const signature = await signTypedData(wallet, typedData)

    expect(verifyTypedData(typedData.domain, typedData.types, typedData.message, signature)).toBe(wallet.address)
  })
})
