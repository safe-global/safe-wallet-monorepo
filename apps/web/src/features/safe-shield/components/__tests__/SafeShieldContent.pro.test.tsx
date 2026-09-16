import { render, screen } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { RecipientAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { SafeShieldContent } from '../SafeShieldContent'

const emptyAnalysis: [undefined, undefined, boolean] = [undefined, undefined, false]

describe('SafeShieldContent Safe Pro gating', () => {
  it('locks the recipient check behind an upgrade without Safe Pro', () => {
    render(
      <SafeShieldContent
        recipient={emptyAnalysis}
        contract={emptyAnalysis}
        threat={emptyAnalysis}
        deadlock={emptyAnalysis}
        hasProFeatures={false}
      />,
    )

    expect(screen.getByTestId('pro-checks-row')).toBeInTheDocument()
    expect(screen.getByTestId('pro-upgrade-link')).toHaveAttribute('href', '/welcome/spaces')
    expect(screen.getByTestId('recipient-analysis-locked')).toHaveTextContent('Known recipient')
    expect(screen.queryByTestId('recipient-analysis-group-card')).not.toBeInTheDocument()
  })

  it('labels the recipient check with the Pro chip, without an upgrade, when it runs', () => {
    const recipient = RecipientAnalysisBuilder.knownRecipient(faker.finance.ethereumAddress()).build()
    render(
      <SafeShieldContent
        recipient={recipient}
        contract={emptyAnalysis}
        threat={emptyAnalysis}
        deadlock={emptyAnalysis}
        hasProFeatures
      />,
    )

    expect(screen.getByTestId('pro-checks-row')).toBeInTheDocument()
    expect(screen.queryByTestId('pro-upgrade-link')).not.toBeInTheDocument()
    expect(screen.queryByTestId('recipient-analysis-locked')).not.toBeInTheDocument()
    expect(screen.getByTestId('recipient-analysis-group-card')).toBeInTheDocument()
  })

  it('shows no Pro chip when there is nothing to label', () => {
    render(
      <SafeShieldContent
        recipient={emptyAnalysis}
        contract={emptyAnalysis}
        threat={emptyAnalysis}
        deadlock={emptyAnalysis}
        hasProFeatures
      />,
    )

    expect(screen.queryByTestId('pro-checks-row')).not.toBeInTheDocument()
  })
})
