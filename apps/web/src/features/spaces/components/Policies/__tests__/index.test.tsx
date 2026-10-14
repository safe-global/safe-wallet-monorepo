import { render, screen, within } from '@/tests/test-utils'
import * as spaces from '@/features/spaces'
import SpacePolicies from '../index'

const mockSafes = (allSafes: unknown[]) =>
  jest.spyOn(spaces, 'useSpaceSafes').mockReturnValue({
    allSafes,
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
  } as never)

describe('SpacePolicies', () => {
  afterEach(() => jest.restoreAllMocks())

  it('renders the Policies heading', () => {
    mockSafes([])
    render(<SpacePolicies />)

    expect(screen.getByRole('heading', { name: 'Policies' })).toBeInTheDocument()
  })

  // The catalogue leads: it is what a reader adds a policy from. The per-Safe list below says
  // what each Safe already has, which is only meaningful once something is configured.
  it('leads with the catalogue, then lists each Safe', () => {
    mockSafes([{ chainId: '1', address: '0x1111111111111111111111111111111111111111', name: 'Ops Safe' }])
    render(<SpacePolicies />)

    expect(screen.getByTestId('policy-catalogue')).toBeInTheDocument()
    expect(screen.getByText('Ops Safe')).toBeInTheDocument()
  })

  it('offers the three guard policies as tiles', () => {
    mockSafes([])
    render(<SpacePolicies />)

    const catalogue = screen.getByTestId('policy-catalogue')

    expect(within(catalogue).getByText('Token recipient allowlist')).toBeInTheDocument()
    expect(within(catalogue).getByText('Batched transactions')).toBeInTheDocument()
    expect(within(catalogue).getByText('Safe management')).toBeInTheDocument()
  })

  it('asks for a Safe when the space has none', () => {
    mockSafes([])
    render(<SpacePolicies />)

    expect(screen.getByText('Add a Safe to this space to configure policies.')).toBeInTheDocument()
  })

  // `?policy=` hands the page over to a builder wizard.
  it.each([['tokenWithdraw'], ['multisend'], ['safeManagement']])(
    'renders a builder instead of the catalogue for ?policy=%s',
    (policy) => {
      mockSafes([])
      render(<SpacePolicies />, { routerProps: { query: { policy, spaceId: 'space-1' } } })

      expect(screen.queryByTestId('policy-catalogue')).not.toBeInTheDocument()
    },
  )

  it('ignores an unknown ?policy= value', () => {
    mockSafes([])
    render(<SpacePolicies />, { routerProps: { query: { policy: 'nope', spaceId: 'space-1' } } })

    expect(screen.getByTestId('policy-catalogue')).toBeInTheDocument()
  })
})
