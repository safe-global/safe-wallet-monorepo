import { render, screen } from '@/tests/test-utils'
import { withHnEligibilityCheck } from '../withHnEligibilityCheck'
import { useIsHypernativeEligible } from '@/features/hypernative/hooks/useIsHypernativeEligible'

jest.mock('@/features/hypernative/hooks/useIsHypernativeEligible')

const mockUseIsHypernativeEligible = useIsHypernativeEligible as jest.MockedFunction<typeof useIsHypernativeEligible>

const TestComponent = () => <div>Security report</div>
const Wrapped = withHnEligibilityCheck(TestComponent)

describe('withHnEligibilityCheck', () => {
  beforeEach(() => {
    mockUseIsHypernativeEligible.mockReturnValue({ isHypernativeEligible: false, loading: false })
  })

  it('returns null when Hypernative eligibility is loading', () => {
    mockUseIsHypernativeEligible.mockReturnValue({ isHypernativeEligible: true, loading: true })

    const { container } = render(<Wrapped />)

    expect(container).toBeEmptyDOMElement()
  })

  it('returns null when not Hypernative eligible', () => {
    const { container } = render(<Wrapped />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders wrapped component when Hypernative eligible', () => {
    mockUseIsHypernativeEligible.mockReturnValue({ isHypernativeEligible: true, loading: false })

    render(<Wrapped />)

    expect(screen.getByText('Security report')).toBeInTheDocument()
  })
})
