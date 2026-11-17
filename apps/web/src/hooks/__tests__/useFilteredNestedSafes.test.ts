import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { act, fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import { addressExBuilder, extendedSafeInfoBuilder } from '@/tests/builders/safe'
import type { RootState } from '@/store'
import { useFilteredNestedSafes } from '../useFilteredNestedSafes'

const parent = extendedSafeInfoBuilder()
  .with({ owners: [addressExBuilder().build(), addressExBuilder().build()] })
  .build()
const parentAddress = parent.address.value
const parentOwner = parent.owners[0].value

const loadedParentState = { safeInfo: { data: parent, loaded: true, loading: false } } as unknown as Partial<RootState>

const respondWithCreators = (creatorBySafe: Record<string, string>) => {
  const requestedSafes: string[] = []
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/creation`, ({ params }) => {
      const safeAddress = String(params.safeAddress)
      requestedSafes.push(safeAddress)
      const creator = creatorBySafe[safeAddress]
      return creator ? HttpResponse.json({ creator }) : new HttpResponse(null, { status: 500 })
    }),
  )
  return requestedSafes
}

const validate = async (nestedSafes: string[]) => {
  const { result } = renderHook(() => useFilteredNestedSafes(nestedSafes, parent.chainId), {
    initialReduxState: loadedParentState,
  })

  act(() => result.current.startFiltering())
  await waitFor(() => expect(result.current.isLoading).toBe(false))

  return result.current.validatedSafes
}

describe('useFilteredNestedSafes', () => {
  it('marks a nested Safe deployed by a parent owner as valid', async () => {
    const nested = fakerChecksummedAddress()
    respondWithCreators({ [nested]: parentOwner.toLowerCase() })

    expect(await validate([nested])).toEqual([{ address: nested, isValid: true }])
  })

  it('marks a nested Safe deployed by the parent Safe itself as valid', async () => {
    const nested = fakerChecksummedAddress()
    respondWithCreators({ [nested]: parentAddress })

    expect(await validate([nested])).toEqual([{ address: nested, isValid: true }])
  })

  it("marks a nested Safe deployed by the parent Safe's deployer as valid", async () => {
    const nested = fakerChecksummedAddress()
    const parentDeployer = fakerChecksummedAddress()
    respondWithCreators({ [parentAddress]: parentDeployer, [nested]: parentDeployer })

    expect(await validate([nested])).toEqual([{ address: nested, isValid: true }])
  })

  it('marks a nested Safe deployed by anyone else as suspicious', async () => {
    const nested = fakerChecksummedAddress()
    respondWithCreators({ [nested]: fakerChecksummedAddress() })

    expect(await validate([nested])).toEqual([{ address: nested, isValid: false }])
  })

  it('marks a nested Safe as suspicious when its creation data cannot be loaded', async () => {
    const nested = fakerChecksummedAddress()
    respondWithCreators({})

    expect(await validate([nested])).toEqual([{ address: nested, isValid: false }])
  })

  it('marks nested Safes beyond the first 10 as suspicious without fetching them', async () => {
    const nestedSafes = Array.from({ length: 12 }, () => fakerChecksummedAddress())
    const checkedSafes = nestedSafes.slice(0, 10)
    const uncheckedSafes = nestedSafes.slice(10)
    const requestedSafes = respondWithCreators(Object.fromEntries(nestedSafes.map((safe) => [safe, parentOwner])))

    const validated = await validate(nestedSafes)

    expect(validated).toEqual([
      ...checkedSafes.map((address) => ({ address, isValid: true })),
      ...uncheckedSafes.map((address) => ({ address, isValid: false })),
    ])
    expect(requestedSafes.filter((safe) => uncheckedSafes.includes(safe))).toEqual([])
  })
})
