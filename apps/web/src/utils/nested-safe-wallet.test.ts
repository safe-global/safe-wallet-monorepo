import type { NextRouter } from 'next/router'
import { getNestedWallet } from './nested-safe-wallet'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { MockEip1193Provider } from '@/tests/mocks/providers'

jest.mock('@/services/safe-wallet-provider', () => ({
  SafeWalletProvider: jest.fn().mockImplementation(() => ({ request: jest.fn() })),
}))

describe('getNestedWallet', () => {
  const router = {} as unknown as NextRouter
  const web3ReadOnly = {} as never

  it('returns a nested wallet that carries the parent Safe state and flags itself as a Safe', () => {
    const parentSafe = safeInfoBuilder().build()
    const actualWallet = { ...connectedWalletBuilder().build(), provider: MockEip1193Provider }

    const nestedWallet = getNestedWallet(actualWallet, parentSafe, web3ReadOnly, router)

    expect(nestedWallet.isSafe).toBe(true)
    expect(nestedWallet.address).toBe(parentSafe.address.value)
    expect(nestedWallet.chainId).toBe(parentSafe.chainId)
    // The parent's full state is reused without a second query.
    expect(nestedWallet.safeInfo).toBe(parentSafe)
  })
})
