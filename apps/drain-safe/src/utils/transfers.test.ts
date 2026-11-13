import { faker } from '@faker-js/faker'
import { decodeFunctionData, erc20Abi, getAddress, type Hex } from 'viem'
import { erc20Balance, nativeBalance } from '../test/balances'
import { isTransferable, tokenToTx } from './transfers'

const recipient = () => getAddress(faker.finance.ethereumAddress())

describe('tokenToTx', () => {
  it('sends the whole native balance straight to the recipient', () => {
    const to = recipient()
    const ether = nativeBalance({ amount: '2' })

    expect(tokenToTx(to, ether)).toEqual({ to, value: '2000000000000000000', data: '0x' })
  })

  it('calls transfer on the token contract with the whole token balance', () => {
    const to = recipient()
    const token = erc20Balance({ amount: '20000' })

    const tx = tokenToTx(to, token)

    expect(tx.to).toBe(token.tokenInfo.address)
    expect(tx.value).toBe('0')
    expect(decodeFunctionData({ abi: erc20Abi, data: tx.data as Hex })).toEqual({
      functionName: 'transfer',
      args: [to, 20000000000n],
    })
  })

  it('throws when the recipient is not an address', () => {
    expect(() => tokenToTx('0xb3b83bf204C458B46', nativeBalance())).toThrow()
  })
})

describe('isTransferable', () => {
  it('excludes the native token when it has no fiat value', () => {
    expect(isTransferable(nativeBalance({ fiatBalance: '0.00000' }))).toBe(false)
  })

  it('includes a token with no fiat value', () => {
    expect(isTransferable(erc20Balance({ fiatBalance: '0' }))).toBe(true)
  })
})
