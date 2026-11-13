import { positionsFixtures } from '@safe-global/test/msw/fixtures'
import { render, screen } from '@/tests/test-utils'
import Positions from '../index'

jest.mock('../hooks/usePositions')
jest.mock('../hooks/usePositionsFiatTotal')
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))

const mockUsePositions = jest.requireMock('../hooks/usePositions').default as jest.Mock
const mockUsePositionsFiatTotal = jest.requireMock('../hooks/usePositionsFiatTotal').default as jest.Mock
const mockUseLoadFeature = jest.requireMock('@/features/__core__').useLoadFeature as jest.Mock

const protocols = positionsFixtures.efSafe
const NOT_IN_TOTAL = 'Position balances are not included in the total asset value.'

function renderPage(positions: { data?: typeof protocols; error?: Error; isLoading?: boolean }) {
  mockUsePositions.mockReturnValue({ data: undefined, error: undefined, isLoading: false, ...positions })
  return render(<Positions />)
}

describe('Positions page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePositionsFiatTotal.mockReturnValue(1000)
    mockUseLoadFeature.mockReturnValue({ PortfolioRefreshHint: () => null, $isDisabled: false })
  })

  it('shows placeholders while the positions load', () => {
    const { container } = renderPage({ isLoading: true })

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
    expect(screen.queryByText('Total positions value')).not.toBeInTheDocument()
  })

  it('says that positions are unavailable when they fail to load', () => {
    renderPage({ error: new Error('Zerion is down') })

    expect(screen.getByTestId('positions-unavailable-text')).toBeInTheDocument()
  })

  it('shows the empty state when the Safe has no positions', () => {
    renderPage({ data: [] })

    expect(screen.getByTestId('no-tx-text')).toBeInTheDocument()
    expect(screen.queryByText('Total positions value')).not.toBeInTheDocument()
  })

  it('shows one open section per app, in order, with a table per position group', () => {
    const { container } = renderPage({ data: protocols })

    expect(screen.getByText('Total positions value')).toBeInTheDocument()
    const sections = container.querySelectorAll('[data-slot="accordion-item"]')
    expect(
      [...sections].map((section) => section.querySelector('[data-slot="accordion-trigger"]')?.textContent),
    ).toEqual(protocols.map(({ protocol_metadata }) => expect.stringContaining(protocol_metadata.name)))
    const groupCount = protocols.reduce((count, { items }) => count + items.length, 0)
    expect(screen.getAllByRole('table')).toHaveLength(groupCount)
  })

  it('says that positions are not in the total asset value only when the portfolio feature is off', () => {
    renderPage({ data: protocols })
    expect(screen.queryByText(NOT_IN_TOTAL)).not.toBeInTheDocument()

    mockUseLoadFeature.mockReturnValue({ PortfolioRefreshHint: () => null, $isDisabled: true })
    renderPage({ data: protocols })
    expect(screen.getByText(NOT_IN_TOTAL)).toBeInTheDocument()
  })
})
