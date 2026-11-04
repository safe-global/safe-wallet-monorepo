import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import type { RootState } from '@/store'
import { addressExBuilder, extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useOwnedSafes from '@/hooks/useOwnedSafes'
import { useIsNestedSafeOwner } from '../useIsNestedSafeOwner'

jest.mock('@/hooks/useOwnedSafes')

const SAFE_CHAIN_ID = '1'
const OTHER_CHAIN_ID = '137'

const parentSafeAddress = faker.finance.ethereumAddress()
const unrelatedSafeAddress = faker.finance.ethereumAddress()

const loadedSafeState = (ownerAddresses: string[]): Partial<RootState> => {
  const owners = ownerAddresses.map((value) => addressExBuilder().with({ value }).build())
  const safe = extendedSafeInfoBuilder().with({ chainId: SAFE_CHAIN_ID, owners }).build()
  return { safeInfo: { data: safe, loaded: true, loading: false } }
}

const renderWithOwnedSafes = (ownedSafes: Record<string, string[]>, initialReduxState: Partial<RootState>) => {
  jest.mocked(useOwnedSafes).mockReturnValue(ownedSafes)
  return renderHook(() => useIsNestedSafeOwner(), { initialReduxState })
}

describe('useIsNestedSafeOwner', () => {
  it('returns true when the wallet owns a Safe that owns this Safe', () => {
    const { result } = renderWithOwnedSafes(
      { [SAFE_CHAIN_ID]: [unrelatedSafeAddress, parentSafeAddress] },
      loadedSafeState([parentSafeAddress]),
    )

    expect(result.current).toBe(true)
  })

  it('returns false when none of the wallet Safes owns this Safe', () => {
    const { result } = renderWithOwnedSafes(
      { [SAFE_CHAIN_ID]: [unrelatedSafeAddress] },
      loadedSafeState([parentSafeAddress]),
    )

    expect(result.current).toBe(false)
  })

  it('returns false when the wallet owns no Safes', () => {
    const { result } = renderWithOwnedSafes({ [SAFE_CHAIN_ID]: [] }, loadedSafeState([parentSafeAddress]))

    expect(result.current).toBe(false)
  })

  it('returns undefined when the wallet owns the parent Safe only on another chain', () => {
    const { result } = renderWithOwnedSafes(
      { [OTHER_CHAIN_ID]: [parentSafeAddress] },
      loadedSafeState([parentSafeAddress]),
    )

    expect(result.current).toBeUndefined()
  })

  it('returns null while the Safe is not loaded', () => {
    const { result } = renderWithOwnedSafes(
      { [SAFE_CHAIN_ID]: [parentSafeAddress] },
      { safeInfo: { data: undefined, loaded: false, loading: true } },
    )

    expect(result.current).toBeNull()
  })
})
