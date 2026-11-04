import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { render, screen, waitFor, within } from '@/tests/test-utils'
import { addressExBuilder, extendedSafeInfoBuilder, safeInfoBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import type { RootState } from '@/store'
import { NestedSafeBreadcrumbs } from '.'

const SEPOLIA = { chainId: '11155111', shortName: 'sep' }
const mockSepolia = chainBuilder().with(SEPOLIA).build()

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [] }),
  useHasFeature: () => true,
  useChain: () => mockSepolia,
  useCurrentChain: () => mockSepolia,
}))

const parentAddress = addressExBuilder().build().value
const nestedSafe = extendedSafeInfoBuilder()
  .with({ chainId: SEPOLIA.chainId, owners: [{ value: parentAddress }] })
  .build()
const nestedSafeParam = `${SEPOLIA.shortName}:${nestedSafe.address.value}`

const respondToOwnerLookup = (response: () => Response) => {
  const lookups = { count: 0 }
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, () => {
      lookups.count += 1
      return response()
    }),
  )
  return lookups
}

const parentSafeResponse = () =>
  HttpResponse.json(
    safeInfoBuilder()
      .with({ address: { value: parentAddress } })
      .build(),
  )

const notFoundResponse = () => new HttpResponse(null, { status: 404 })

const renderBreadcrumbs = () => {
  const initialReduxState = {
    safeInfo: { data: nestedSafe, loaded: true, loading: false },
    addressBook: { [SEPOLIA.chainId]: { [parentAddress]: 'Main nested safe' } },
  } as unknown as Partial<RootState>

  return render(<NestedSafeBreadcrumbs />, {
    initialReduxState,
    routerProps: { pathname: '/home', query: { safe: nestedSafeParam } },
  })
}

const safeParamOf = (link: HTMLElement) =>
  new URL(link.getAttribute('href') ?? '', window.location.origin).searchParams.get('safe')

describe('NestedSafeBreadcrumbs', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', `/home?safe=${nestedSafeParam}`)
  })

  it('links to the parent Safe by its address book name when the only owner is a Safe', async () => {
    respondToOwnerLookup(parentSafeResponse)

    renderBreadcrumbs()

    const parentLink = await within(await screen.findByLabelText('Parent Safe')).findByRole('link')
    expect(parentLink).toHaveTextContent('Main nested safe')
    expect(safeParamOf(parentLink)).toBe(`${SEPOLIA.shortName}:${parentAddress}`)
    expect(screen.getByLabelText('Nested Safe')).toBeVisible()
  })

  it('shows no parent link when the only owner is not a Safe', async () => {
    const lookups = respondToOwnerLookup(notFoundResponse)

    renderBreadcrumbs()

    await waitFor(() => expect(lookups.count).toBe(1))
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
