import type { JsonRpcSigner } from 'ethers'
import { faker } from '@faker-js/faker'
import { signTypedData } from '@safe-global/utils/utils/web3'
import { signTxServiceMessage } from '../gateway'

jest.mock('@safe-global/utils/utils/web3', () => ({
  signTypedData: jest.fn(),
}))

describe('signTxServiceMessage', () => {
  it('signs a DeleteRequest for the Safe Queue Service domain', async () => {
    const signature = faker.string.hexadecimal({ length: 130 })
    jest.mocked(signTypedData).mockResolvedValue(signature)
    const signer = {} as JsonRpcSigner
    const safeAddress = faker.finance.ethereumAddress()
    const safeTxHash = faker.string.hexadecimal({ length: 64 })
    const now = Date.now()
    jest.spyOn(Date, 'now').mockReturnValue(now)

    const result = await signTxServiceMessage('11155111', safeAddress, safeTxHash, signer)

    expect(result).toBe(signature)
    expect(signTypedData).toHaveBeenCalledWith(signer, {
      types: {
        DeleteRequest: [
          { name: 'safeTxHash', type: 'bytes32' },
          { name: 'totp', type: 'uint256' },
        ],
      },
      domain: {
        name: 'Safe Queue Service',
        version: '1.0',
        chainId: 11155111,
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
