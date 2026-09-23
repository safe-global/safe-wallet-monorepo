import { renderHook } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import * as useIsNestedSafeOwnerModule from '@/hooks/useIsNestedSafeOwner'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import * as useWalletModule from '@/hooks/wallets/useWallet'
import { useIsNestedOnlyOwner } from '../useIsNestedOnlyOwner'

const WALLET = checksumAddress(faker.finance.ethereumAddress())
const OTHER_OWNER = checksumAddress(faker.finance.ethereumAddress())

const mockSafe = (owners: string[], safeLoaded = true) => {
  const safe = extendedSafeInfoBuilder()
    .with({ owners: owners.map((value) => ({ value })) })
    .build()
  jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
    safe,
    safeAddress: safe.address.value,
    safeLoaded,
    safeLoading: !safeLoaded,
    safeError: undefined,
  })
}

describe('useIsNestedOnlyOwner', () => {
  beforeEach(() => {
    jest.spyOn(useWalletModule, 'default').mockReturnValue(connectedWalletBuilder().with({ address: WALLET }).build())
    jest.spyOn(useIsNestedSafeOwnerModule, 'useIsNestedSafeOwner').mockReturnValue(true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('is true when the wallet owns the Safe only through a parent Safe', () => {
    mockSafe([OTHER_OWNER])

    expect(renderHook(() => useIsNestedOnlyOwner()).result.current).toBe(true)
  })

  it('is false for a direct owner, even one that also owns a parent Safe', () => {
    mockSafe([WALLET, OTHER_OWNER])

    expect(renderHook(() => useIsNestedOnlyOwner()).result.current).toBe(false)
  })

  it('is false when the wallet owns neither the Safe nor a parent', () => {
    mockSafe([OTHER_OWNER])
    jest.spyOn(useIsNestedSafeOwnerModule, 'useIsNestedSafeOwner').mockReturnValue(false)

    expect(renderHook(() => useIsNestedOnlyOwner()).result.current).toBe(false)
  })

  it('is false until the Safe has loaded', () => {
    mockSafe([OTHER_OWNER], false)

    expect(renderHook(() => useIsNestedOnlyOwner()).result.current).toBe(false)
  })

  it('is false without a connected wallet', () => {
    mockSafe([OTHER_OWNER])
    jest.spyOn(useWalletModule, 'default').mockReturnValue(null)
    jest.spyOn(useIsNestedSafeOwnerModule, 'useIsNestedSafeOwner').mockReturnValue(false)

    expect(renderHook(() => useIsNestedOnlyOwner()).result.current).toBe(false)
  })
})
