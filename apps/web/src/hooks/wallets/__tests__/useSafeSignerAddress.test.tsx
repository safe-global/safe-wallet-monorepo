import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { WalletContext, type SignerWallet } from '@/components/common/WalletProvider'
import useSafeSignerAddress from '@/hooks/wallets/useSafeSignerAddress'

const renderWithSigner = (signer: SignerWallet | null) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <WalletContext.Provider value={{ connectedWallet: null, signer, setSignerAddress: jest.fn(), isReady: true }}>
      {children}
    </WalletContext.Provider>
  )
  return renderHook(() => useSafeSignerAddress(), { wrapper })
}

const signerWallet = (overrides: Partial<SignerWallet>): SignerWallet => ({
  address: faker.finance.ethereumAddress(),
  chainId: '1',
  provider: null,
  ...overrides,
})

describe('useSafeSignerAddress', () => {
  it.each([
    { kind: 'a Safe connected over WalletConnect', flags: { isConnectedSafe: true } },
    { kind: 'an in-app parent Safe', flags: { isSafe: true } },
  ])('returns the address of $kind', ({ flags }) => {
    const signer = signerWallet(flags)

    expect(renderWithSigner(signer).result.current).toBe(signer.address)
  })

  it('returns nothing for an EOA signer', () => {
    expect(renderWithSigner(signerWallet({})).result.current).toBeUndefined()
  })

  it('returns nothing without a signer', () => {
    expect(renderWithSigner(null).result.current).toBeUndefined()
  })
})
