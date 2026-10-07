import type { JsonRpcSigner } from 'ethers'
import { faker } from '@faker-js/faker'
import { signTypedData } from '@safe-global/utils/utils/web3'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'
import { deleteTransaction } from '../transactions'
import { deleteTx, signTxServiceMessage } from '../gateway'

jest.mock('@safe-global/utils/utils/web3', () => ({
  signTypedData: jest.fn(),
}))

jest.mock('../transactions', () => ({
  deleteTransaction: jest.fn(),
}))

const featuresWithout = (feature: FEATURES) =>
  faker.helpers.arrayElements(Object.values(FEATURES).filter((value) => value !== feature))

describe('signTxServiceMessage', () => {
  const signer = {} as JsonRpcSigner

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ['without', 'Safe Transaction Service', featuresWithout(FEATURES.QUEUE_SERVICE)],
    ['with', 'Safe Queue Service', [...featuresWithout(FEATURES.QUEUE_SERVICE), FEATURES.QUEUE_SERVICE]],
  ])('signs a DeleteRequest on a chain %s QUEUE_SERVICE for the %s domain', async (_, domainName, features) => {
    const signature = faker.string.hexadecimal({ length: 130 })
    jest.mocked(signTypedData).mockResolvedValue(signature)
    const chain = chainBuilder().with({ features }).build()
    const safeAddress = faker.finance.ethereumAddress()
    const safeTxHash = faker.string.hexadecimal({ length: 64 })
    const now = Date.now()
    jest.spyOn(Date, 'now').mockReturnValue(now)

    const result = await signTxServiceMessage(chain, safeAddress, safeTxHash, signer)

    expect(result).toBe(signature)
    expect(signTypedData).toHaveBeenCalledWith(signer, {
      types: {
        DeleteRequest: [
          { name: 'safeTxHash', type: 'bytes32' },
          { name: 'totp', type: 'uint256' },
        ],
      },
      domain: {
        name: domainName,
        version: '1.0',
        chainId: Number(chain.chainId),
        verifyingContract: safeAddress,
      },
      message: {
        safeTxHash,
        totp: Math.floor(now / 3600e3),
      },
      primaryType: 'DeleteRequest',
    })
  })
})

describe('deleteTx', () => {
  it('deletes the transaction on the chain with the DeleteRequest signature', async () => {
    const signature = faker.string.hexadecimal({ length: 130 })
    jest.mocked(signTypedData).mockResolvedValue(signature)
    const chain = chainBuilder().build()
    const safeTxHash = faker.string.hexadecimal({ length: 64 })

    await deleteTx({
      chain,
      safeAddress: faker.finance.ethereumAddress(),
      safeTxHash,
      signer: {} as JsonRpcSigner,
    })

    expect(deleteTransaction).toHaveBeenCalledWith(chain.chainId, safeTxHash, signature)
  })
})
