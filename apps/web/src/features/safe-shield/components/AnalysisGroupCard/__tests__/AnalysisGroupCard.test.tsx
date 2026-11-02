import { faker } from '@faker-js/faker'
import { screen, render, renderWithUserEvent } from '@/tests/test-utils'
import { AnalysisGroupCard } from '../AnalysisGroupCard'
import {
  Severity,
  ThreatStatus,
  StatusGroup,
  type AnalysisResult,
  type StatusGroupType,
} from '@safe-global/utils/features/safe-shield/types'
import {
  RecipientAnalysisBuilder,
  RecipientAnalysisResultBuilder,
} from '@safe-global/utils/features/safe-shield/builders'

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

  it('expands and collapses from the keyboard', async () => {
    const { user } = renderWithUserEvent(
      <AnalysisGroupCard
        data={
          {
            '0x': {
              THREAT: [
                { severity: Severity.WARN, type: ThreatStatus.MODERATE, title: 'Threat A', description: 'desc-a' },
              ],
            },
          } as unknown as Parameters<typeof AnalysisGroupCard>[0]['data']
        }
      />,
    )

    await screen.findByText('Threat A')
    await user.tab()
    const header = screen.getByRole('button', { name: /Threat A/ })
    expect(header).toHaveFocus()
    expect(header).toHaveAttribute('aria-expanded', 'false')

    await user.keyboard('{Enter}')
    expect(header).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('desc-a')).toBeVisible()

    await user.keyboard(' ')
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })
})

const RECURRING_TWICE = 'You have interacted with this address 2 times.'

const recipientData = (builder: RecipientAnalysisBuilder) => builder.build()[0] ?? {}

const withInteraction = (result: AnalysisResult<StatusGroupType<StatusGroup.RECIPIENT_INTERACTION>>) => ({
  result,
  data: recipientData(
    new RecipientAnalysisBuilder().addAddress(faker.finance.ethereumAddress()).interactionState([result]).done(),
  ),
})

const withBridge = (result: AnalysisResult<StatusGroupType<StatusGroup.BRIDGE>>) => ({
  result,
  data: recipientData(
    new RecipientAnalysisBuilder().addAddress(faker.finance.ethereumAddress()).bridgeState([result]).done(),
  ),
})

describe('AnalysisGroupCard recipient findings', () => {
  it.each([
    ['new recipient', withInteraction(RecipientAnalysisResultBuilder.newRecipient().build())],
    [
      'recurring recipient',
      withInteraction(RecipientAnalysisResultBuilder.recurringRecipient().description(RECURRING_TWICE).build()),
    ],
    ['incompatible Safe', withBridge(RecipientAnalysisResultBuilder.incompatibleSafe().build())],
    ['missing ownership', withBridge(RecipientAnalysisResultBuilder.missingOwnership().build())],
    ['unsupported network', withBridge(RecipientAnalysisResultBuilder.unsupportedNetwork().build())],
    ['different setup', withBridge(RecipientAnalysisResultBuilder.differentSafeSetup().build())],
  ])('shows the title and the gateway description of a %s finding', async (_, { result, data }) => {
    render(<AnalysisGroupCard data={data} />)

    expect(await screen.findByText(result.title)).toBeInTheDocument()
    expect(screen.getByText(result.description)).toBeInTheDocument()
  })

  it('heads the card with the most severe finding and still lists the recurring recipient', async () => {
    const builder = new RecipientAnalysisBuilder()
      .addAddress(faker.finance.ethereumAddress())
      .interactionState([RecipientAnalysisResultBuilder.recurringRecipient().description(RECURRING_TWICE).build()])
      .activityState([RecipientAnalysisResultBuilder.lowActivity().build()])
      .bridgeState([RecipientAnalysisResultBuilder.differentSafeSetup().build()])
      .done()

    render(<AnalysisGroupCard data={recipientData(builder)} />)

    const header = await screen.findByRole('button', { name: /Low activity/ })
    expect(header).not.toHaveTextContent('Recurring recipient')
    expect(screen.getByText(RECURRING_TWICE)).toBeInTheDocument()
    expect(
      screen.getByText(RecipientAnalysisResultBuilder.differentSafeSetup().build().description),
    ).toBeInTheDocument()
  })
})
