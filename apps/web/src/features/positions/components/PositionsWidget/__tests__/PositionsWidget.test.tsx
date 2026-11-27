import { positionsFixtures } from '@safe-global/test/msw/fixtures'
import { render, screen } from '@/tests/test-utils'
import PositionsWidget from '../index'

jest.mock('../../../hooks/usePositions')
jest.mock('../../../hooks/usePositionsFiatTotal')
jest.mock('@/hooks/useChains', () => ({
  ...jest.requireActual('@/hooks/useChains'),
  useHasFeature: jest.fn(),
}))

const mockUsePositions = jest.requireMock('../../../hooks/usePositions').default as jest.Mock
const mockUsePositionsFiatTotal = jest.requireMock('../../../hooks/usePositionsFiatTotal').default as jest.Mock
const mockUseHasFeature = jest.requireMock('@/hooks/useChains').useHasFeature as jest.Mock

const SAFE = 'eth:0x1111111111111111111111111111111111111111'
const protocols = positionsFixtures.efSafe
const NOT_IN_TOTAL = 'Position balances are not included in the total asset value.'
const appNames = protocols.map(({ protocol_metadata }) => protocol_metadata.name)

function renderWidget(positions: { data?: typeof protocols; error?: Error; isLoading?: boolean }) {
  mockUsePositions.mockReturnValue({ data: undefined, error: undefined, isLoading: false, ...positions })
  return render(<PositionsWidget />, { routerProps: { query: { safe: SAFE } } })
}

describe('PositionsWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePositionsFiatTotal.mockReturnValue(1000)
    mockUseHasFeature.mockReturnValue(true)
  })

  it('shows placeholders under its title while the positions load', () => {
    const { container } = renderWidget({ isLoading: true })

    expect(screen.getByText('Top positions')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it('stays hidden when the positions fail to load', () => {
    renderWidget({ error: new Error('Zerion is down') })

    expect(screen.queryByText('Top positions')).not.toBeInTheDocument()
  })

  it('stays hidden when the Safe has no positions', () => {
    renderWidget({ data: [] })

    expect(screen.queryByText('Top positions')).not.toBeInTheDocument()
  })

  it('shows the first four apps and links to all positions of the Safe', () => {
    renderWidget({ data: protocols })

    for (const name of appNames.slice(0, 4)) expect(screen.getByText(name)).toBeInTheDocument()
    for (const name of appNames.slice(4)) expect(screen.queryByText(name)).not.toBeInTheDocument()
    expect(screen.getByTestId('view-all-link')).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/balances\/positions\?safe=eth(%3A|:)0x1111111111111111111111111111111111111111/),
    )
  })

  it('says that positions are not in the total asset value only without the portfolio endpoint', () => {
    renderWidget({ data: protocols })
    expect(screen.queryByText(NOT_IN_TOTAL)).not.toBeInTheDocument()

    mockUseHasFeature.mockReturnValue(false)
    renderWidget({ data: protocols })
    expect(screen.getByText(NOT_IN_TOTAL)).toBeInTheDocument()
  })
})
