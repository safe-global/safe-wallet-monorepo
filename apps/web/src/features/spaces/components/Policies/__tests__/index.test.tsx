import { render, renderWithUserEvent, screen, within } from '@/tests/test-utils'
import * as spaces from '@/features/spaces'
import { mockTokenAllowlistDto, mockSafeManagementDto } from '../mocks/activePolicies'
import { mapActivePolicies } from '../utils/mapActivePolicies'
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

  // With nothing configured the catalogue is the whole page; it is what a policy is added from.
  it('leads with the catalogue while the space has no policies', () => {
    mockSafes([{ chainId: '1', address: '0x1111111111111111111111111111111111111111', name: 'Ops Safe' }])
    render(<SpacePolicies />)

    expect(screen.getByTestId('policy-catalogue')).toBeInTheDocument()
  })

  // Guard policies share the table with spending limits and proposers rather than a list of their own.
  it('lists guard policies in the same table once the space has some', () => {
    mockSafes([])
    const policies = mapActivePolicies([mockTokenAllowlistDto(), mockSafeManagementDto()])
    render(<SpacePolicies policies={policies} />)

    expect(screen.queryByTestId('policy-catalogue')).not.toBeInTheDocument()

    // Scoped to the rows: the same labels also name the filter chips above the table.
    const rows = screen.getAllByTestId('policy-open-button')
    expect(rows).toHaveLength(2)
    expect(screen.getAllByText('Token recipient allowlist').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Safe management').length).toBeGreaterThan(0)
  })

  it('offers the three guard policies as tiles', () => {
    mockSafes([])
    render(<SpacePolicies />)

    const catalogue = screen.getByTestId('policy-catalogue')

    expect(within(catalogue).getByText('Token recipient allowlist')).toBeInTheDocument()
    expect(within(catalogue).getByText('Batched transactions')).toBeInTheDocument()
    expect(within(catalogue).getByText('Safe management')).toBeInTheDocument()
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

  // The Add policy dialog is a second route to the same builders as the catalogue tiles.
  it.each([
    ['Token recipient allowlist', 'tokenWithdraw'],
    ['Batched transactions', 'multisend'],
    ['Safe management', 'safeManagement'],
  ])('opens the %s builder from the Add policy dialog', async (title, wizard) => {
    mockSafes([])
    const policies = mapActivePolicies([mockTokenAllowlistDto()])
    const push = jest.fn(() => Promise.resolve(true))
    const { user } = renderWithUserEvent(<SpacePolicies policies={policies} />, {
      routerProps: { push, query: { spaceId: 'space-1' } },
    })

    await user.click(screen.getByRole('button', { name: /add policy/i }))
    await user.click(within(screen.getByTestId('add-policy-options')).getByText(title))

    expect(push).toHaveBeenCalledWith(expect.objectContaining({ query: expect.objectContaining({ policy: wizard }) }))
  })

  it('ignores an unknown ?policy= value', () => {
    mockSafes([])
    render(<SpacePolicies />, { routerProps: { query: { policy: 'nope', spaceId: 'space-1' } } })

    expect(screen.getByTestId('policy-catalogue')).toBeInTheDocument()
  })
})
