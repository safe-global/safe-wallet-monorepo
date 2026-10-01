import { render, screen } from '@/tests/test-utils'
import { ProChecksRow } from '../ProChecksRow'

let mockSpaceId: string | null = 'space-1'
jest.mock('@/features/spaces', () => ({
  useSafeProAccess: () => ({ hasProFeatures: false, isLoading: false, spaceId: mockSpaceId }),
}))

describe('ProChecksRow', () => {
  it('links to the plans of the Workspace holding the Safe when it has no Pro features', () => {
    render(<ProChecksRow hasProFeatures={false} />)

    expect(screen.getByLabelText('Safe Pro')).toBeInTheDocument()
    expect(screen.getByTestId('pro-upgrade-link')).toHaveAttribute('href', '/spaces/plans?spaceId=space-1')
    expect(screen.getByTestId('pro-upgrade-link')).toHaveTextContent('Upgrade')
  })

  it('falls back to the Workspaces list when no Workspace holds the Safe', () => {
    mockSpaceId = null
    render(<ProChecksRow hasProFeatures={false} />)

    expect(screen.getByTestId('pro-upgrade-link')).toHaveAttribute('href', '/welcome/spaces')
  })

  it('renders as a labelled divider with the same Upgrade link in the divider variant', () => {
    mockSpaceId = 'space-1'
    render(<ProChecksRow hasProFeatures={false} variant="divider" />)

    expect(screen.getByText('Pro checks')).toBeInTheDocument()
    expect(screen.queryByLabelText('Safe Pro')).not.toBeInTheDocument()
    expect(screen.getByTestId('pro-upgrade-link')).toHaveAttribute('href', '/spaces/plans?spaceId=space-1')
  })

  it('only shows the chip with Pro', () => {
    render(<ProChecksRow hasProFeatures />)

    expect(screen.getByLabelText('Safe Pro')).toBeInTheDocument()
    expect(screen.queryByTestId('pro-upgrade-link')).not.toBeInTheDocument()
  })
})
