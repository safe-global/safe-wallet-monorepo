import { render, screen } from '@/tests/test-utils'
import { withGuardCheck } from '../withGuardCheck'
import { useIsHypernativeGuard } from '../../../hooks/useIsHypernativeGuard'

jest.mock('../../../hooks/useIsHypernativeGuard')

const mockUseIsHypernativeGuard = useIsHypernativeGuard as jest.MockedFunction<typeof useIsHypernativeGuard>

const TestComponent = () => <div>Security report</div>
const Wrapped = withGuardCheck(TestComponent)

describe('withGuardCheck', () => {
  beforeEach(() => {
    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: false, loading: false })
  })

  it('returns null when guard check is loading', () => {
    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: true, loading: true })

    const { container } = render(<Wrapped />)

    expect(container).toBeEmptyDOMElement()
  })

  it('returns null when guard is not active', () => {
    const { container } = render(<Wrapped />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders wrapped component when guard is active', () => {
    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: true, loading: false })

    render(<Wrapped />)

    expect(screen.getByText('Security report')).toBeInTheDocument()
  })
})
