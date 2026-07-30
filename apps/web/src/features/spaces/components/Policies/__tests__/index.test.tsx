import { render, screen } from '@/tests/test-utils'
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

    expect(screen.getByRole('heading', { level: 1, name: 'Policies' })).toBeInTheDocument()
  })

  // Policies apply per Safe, so the page leads with the Safes rather than a policy catalogue.
  it('lists the space Safes, each owning its policy sections', () => {
    mockSafes([{ chainId: '1', address: '0x1111111111111111111111111111111111111111', name: 'Ops Safe' }])
    render(<SpacePolicies />)

    expect(screen.getByText('Ops Safe')).toBeInTheDocument()
  })

  it('asks for a Safe when the space has none', () => {
    mockSafes([])
    render(<SpacePolicies />)

    expect(screen.getByText('Add a Safe to this space to configure policies.')).toBeInTheDocument()
  })

  // `?policy=` hands the page over to a builder wizard.
  it('renders a builder instead of the list when a policy flow is open', () => {
    mockSafes([])
    render(<SpacePolicies />, { routerProps: { query: { policy: 'tokenWithdraw', spaceId: 'space-1' } } })

    expect(screen.queryByRole('heading', { level: 1, name: 'Policies' })).not.toBeInTheDocument()
  })
})
