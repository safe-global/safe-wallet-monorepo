import { screen, renderWithUserEvent } from '@/tests/test-utils'
import { AnalysisGroupCard } from '../AnalysisGroupCard'
import { Severity, ThreatStatus, StatusGroup } from '@safe-global/utils/features/safe-shield/types'

describe('AnalysisGroupCard with expandedGroups', () => {
  it('renders every result in a listed group instead of just the primary', async () => {
    const { user } = renderWithUserEvent(
      <AnalysisGroupCard
        data={
          {
            '0x': {
              THREAT: [
                { severity: Severity.WARN, type: ThreatStatus.MODERATE, title: 'Threat A', description: 'desc-a' },
                { severity: Severity.WARN, type: ThreatStatus.MODERATE, title: 'Threat B', description: 'desc-b' },
                { severity: Severity.INFO, type: ThreatStatus.MODERATE, title: 'Threat C', description: 'desc-c' },
              ],
            },
          } as unknown as Parameters<typeof AnalysisGroupCard>[0]['data']
        }
        expandedGroups={[StatusGroup.THREAT]}
      />,
    )

    // Header shows primary (Threat A — highest severity)
    expect(await screen.findByText('Threat A')).toBeInTheDocument()

    // Expand the card
    await user.click(screen.getByText('Threat A'))

    // All three descriptions appear after expand
    expect(screen.getByText('desc-a')).toBeInTheDocument()
    expect(screen.getByText('desc-b')).toBeInTheDocument()
    expect(screen.getByText('desc-c')).toBeInTheDocument()
  })

  it('still collapses to primary when expandedGroups is omitted', async () => {
    const { user } = renderWithUserEvent(
      <AnalysisGroupCard
        data={
          {
            '0x': {
              THREAT: [
                { severity: Severity.WARN, type: ThreatStatus.MODERATE, title: 'Threat A', description: 'desc-a' },
                { severity: Severity.WARN, type: ThreatStatus.MODERATE, title: 'Threat B', description: 'desc-b' },
              ],
            },
          } as unknown as Parameters<typeof AnalysisGroupCard>[0]['data']
        }
      />,
    )

    // Header shows primary
    expect(await screen.findByText('Threat A')).toBeInTheDocument()

    // Expand the card
    await user.click(screen.getByText('Threat A'))

    // Only primary description appears; secondary is not rendered
    expect(screen.getByText('desc-a')).toBeInTheDocument()
    expect(screen.queryByText('desc-b')).not.toBeInTheDocument()
  })
})
