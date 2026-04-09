import { render } from '@/tests/test-utils'
import { HnAnalysisGroupCard } from './index'
import type { AnalysisGroupCardProps } from '@/features/safe-shield/components/AnalysisGroupCard'
import { AnalysisGroupCard } from '@/features/safe-shield/components/AnalysisGroupCard'

jest.mock('@/features/safe-shield/components/AnalysisGroupCard', () => ({
  AnalysisGroupCard: jest.fn(() => <div data-testid="analysis-group-card">AnalysisGroupCard</div>),
}))

jest.mock('../HypernativeLogo', () => ({
  __esModule: true,
  default: () => <div data-testid="hn-logo">HypernativeLogo</div>,
}))

const mockAnalysisGroupCard = AnalysisGroupCard as jest.MockedFunction<typeof AnalysisGroupCard>

describe('HnAnalysisGroupCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should strip requestId before passing props to AnalysisGroupCard', () => {
    render(<HnAnalysisGroupCard data={{}} requestId="test-request-id" />)

    expect(mockAnalysisGroupCard).toHaveBeenCalledTimes(1)
    const receivedProps = mockAnalysisGroupCard.mock.calls[0][0] as AnalysisGroupCardProps
    expect(receivedProps.requestId).toBeUndefined()
  })

  it('should pass other props to AnalysisGroupCard', () => {
    render(<HnAnalysisGroupCard data={{}} delay={500} data-testid="test-card" />)

    expect(mockAnalysisGroupCard).toHaveBeenCalledTimes(1)
    const receivedProps = mockAnalysisGroupCard.mock.calls[0][0] as AnalysisGroupCardProps
    expect(receivedProps.delay).toBe(500)
    expect(receivedProps['data-testid']).toBe('test-card')
  })

  it('should render Hypernative branding footer', () => {
    render(<HnAnalysisGroupCard data={{}} />)

    const receivedProps = mockAnalysisGroupCard.mock.calls[0][0] as AnalysisGroupCardProps
    expect(receivedProps.footer).toBeDefined()
  })
})
