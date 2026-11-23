import { render, screen } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import { ThreatAnalysis } from '../ThreatAnalysis'
import type { ThreatAnalysisResult, ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { Severity, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { hypernativeAuthStatusBuilder } from '@/tests/builders/hypernativeAuthStatus'

jest.mock('@/services/analytics', () => ({
  ...(
    jest.requireActual('@safe-global/test/mocks/analytics') as { createAnalyticsMock: () => object }
  ).createAnalyticsMock(),
}))
jest.mock('@/features/hypernative/public/hooks/useSafeShieldAssessmentUrl', () => ({
  useSafeShieldAssessmentUrl: jest.fn(() => 'https://hn.example/report'),
}))

describe('ThreatAnalysis on the Hypernative path', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows the threat findings on the first render while the flag is on', () => {
    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => feature === FEATURES.HYPERNATIVE)
    const finding = {
      severity: Severity.WARN,
      type: ThreatStatus.HYPERNATIVE_GUARD,
      title: 'Threat detected',
      description: 'This is a threat',
    } as ThreatAnalysisResult
    const threat: AsyncResult<ThreatAnalysisResults> = [{ THREAT: [finding] }, undefined, false]
    const hypernativeAuth = hypernativeAuthStatusBuilder()
      .with({ isAuthenticated: true, isTokenExpired: false })
      .build()

    render(<ThreatAnalysis threat={threat} hypernativeAuth={hypernativeAuth} />)

    expect(screen.getByText('Threat detected')).toBeInTheDocument()
  })
})
