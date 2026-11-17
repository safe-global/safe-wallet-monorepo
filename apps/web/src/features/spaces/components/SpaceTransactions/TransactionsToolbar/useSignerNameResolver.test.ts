import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import useWallet from '@/hooks/wallets/useWallet'
import { renderHook } from '@/tests/test-utils'
import { useSignerNameResolver } from './useSignerNameResolver'

jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: jest.fn() }))

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>

const walletAddress = checksumAddress(faker.finance.ethereumAddress())
const signer = checksumAddress(faker.finance.ethereumAddress())

const resolve = (address: string, addressBook: Record<string, Record<string, string>> = {}) => {
  const { result } = renderHook(() => useSignerNameResolver(['1', '137']), {
    initialReduxState: { addressBook },
  })
  return result.current(address)
}

describe('useSignerNameResolver', () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue({ address: walletAddress } as ReturnType<typeof useWallet>)
  })

  it('marks the connected wallet with its name', () => {
    const name = faker.person.firstName()

    expect(resolve(walletAddress, { '1': { [walletAddress]: name } })).toBe(`${name} (you)`)
  })

  it('names the connected wallet "You" when it has no name', () => {
    expect(resolve(walletAddress)).toBe('You')
  })

  it('finds a signer name on any of the chains', () => {
    const name = faker.person.firstName()

    expect(resolve(signer, { '137': { [signer]: name } })).toBe(name)
  })

  it('shortens the address of a signer without a name', () => {
    expect(resolve(signer)).toBe(shortenAddress(signer))
  })
})
