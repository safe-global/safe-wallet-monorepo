import { render, screen } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import {
  ContractAnalysisBuilder,
  DeadlockAnalysisBuilder,
  RecipientAnalysisBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { ThreatAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis.builder'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { HypernativeAuthStatus } from '@/features/hypernative'
import { hypernativeAuthStatusBuilder } from '@/tests/builders/hypernativeAuthStatus'
import { SafeShieldContent } from '../SafeShieldContent'

let mockHasOwnTenderly = false
jest.mock('../../hooks/useHasOwnTenderly', () => ({ useHasOwnTenderly: () => mockHasOwnTenderly }))
// Explicit stubs: spreading the real module here pulls a circular import chain into the mock factory.
jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ chainId: '1', features: ['TX_SIMULATION'] }),
  useHasFeature: () => true,
}))
jest.mock('@safe-global/utils/components/tx/security/tenderly/utils', () => ({
  ...jest.requireActual('@safe-global/utils/components/tx/security/tenderly/utils'),
  isTxSimulationEnabled: () => true,
}))
jest.mock('../useNestedTransaction', () => ({ useNestedTransaction: () => ({ isNested: false }) }))
let mockProSpaceId: string | null = null
jest.mock('@/features/spaces', () => ({
  useSafeProAccess: () => ({ hasProFeatures: false, isLoading: false, spaceId: mockProSpaceId }),
}))
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { chainId: '1', owners: [{ value: '0x00000000000000000000000000000000000000f1' }] } }),
}))

const emptyAnalysis: [undefined, undefined, boolean] = [undefined, undefined, false]
const safeTx = {
  data: { to: '0x00000000000000000000000000000000000000aa', value: '0', data: '0x', operation: 0 },
} as unknown as SafeTransaction
const contractCallTx = {
  data: { to: '0x00000000000000000000000000000000000000aa', value: '0', data: '0xa9059cbb', operation: 0 },
} as unknown as SafeTransaction
const renderContent = (hasProFeatures: boolean, hypernativeAuth?: HypernativeAuthStatus) =>
  render(
    <SafeShieldContent
      recipient={emptyAnalysis}
      contract={emptyAnalysis}
      threat={emptyAnalysis}
      deadlock={emptyAnalysis}
      safeTx={safeTx}
      hasProFeatures={hasProFeatures}
      hypernativeAuth={hypernativeAuth}
    />,
  )

describe('SafeShieldContent Safe Pro gating', () => {
  beforeEach(() => {
    mockHasOwnTenderly = false
  })

  it('keeps the pre-Pro layout while SAFE_PRO is off: counterparty checks among the open ones, simulation by hand, no PRO block', () => {
    const recipient = RecipientAnalysisBuilder.knownRecipient(faker.finance.ethereumAddress()).build()
    render(
      <SafeShieldContent
        recipient={recipient}
        contract={ContractAnalysisBuilder.verifiedContract().build()}
        threat={emptyAnalysis}
        deadlock={DeadlockAnalysisBuilder.deadlockDetected()}
        safeTx={safeTx}
        hasProFeatures
        isSafePro={false}
      />,
    )

    expect(screen.queryByTestId('pro-checks-section')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pro-checks-row')).not.toBeInTheDocument()
    const openChecks = screen.getByTestId('open-checks-list')
    expect(openChecks).toContainElement(screen.getByTestId('recipient-analysis-group-card'))
    expect(openChecks).toContainElement(screen.getByTestId('contract-analysis-group-card'))
    expect(openChecks).toContainElement(screen.getByTestId('deadlock-analysis-group-card'))
    expect(openChecks).toContainElement(screen.getByTestId('tenderly-simulation'))
    expect(screen.getByTestId('run-simulation-btn')).toBeInTheDocument()
  })

  it('locks the simulation without Safe Pro and without a Tenderly project of one’s own', () => {
    renderContent(false)

    expect(screen.getByTestId('tenderly-simulation-locked')).toBeInTheDocument()
    expect(screen.queryByTestId('tenderly-simulation')).not.toBeInTheDocument()
  })

  it('groups the Pro checks after the open ones', () => {
    const recipient = RecipientAnalysisBuilder.knownRecipient(faker.finance.ethereumAddress()).build()
    render(
      <SafeShieldContent
        recipient={recipient}
        contract={ContractAnalysisBuilder.verifiedContract().build()}
        threat={emptyAnalysis}
        deadlock={DeadlockAnalysisBuilder.deadlockDetected()}
        safeTx={safeTx}
        hasProFeatures
      />,
    )

    const section = screen.getByTestId('pro-checks-section')
    expect(section).toContainElement(screen.getByTestId('recipient-analysis-group-card'))
    expect(section).toContainElement(screen.getByTestId('contract-analysis-group-card'))
    expect(section).toContainElement(screen.getByTestId('deadlock-analysis-group-card'))
    expect(section).toContainElement(screen.getByTestId('tenderly-simulation'))
    expect(screen.getByTestId('open-checks-list')).not.toContainElement(
      screen.getByTestId('contract-analysis-group-card'),
    )
    expect(section.previousElementSibling).toBe(screen.getByTestId('open-checks-list'))
    expect(section.nextElementSibling).toBeNull()
  })

  it.each([true, false])(
    'places the Hypernative login under the Pro checks for an eligible Safe (hasProFeatures: %s)',
    (hasProFeatures) => {
      renderContent(hasProFeatures, hypernativeAuthStatusBuilder().build())

      expect(screen.getByTestId('pro-checks-section').nextElementSibling).toBe(
        screen.getByTestId('hypernative-login-line'),
      )
    },
  )

  it('offers the Hypernative login after the open checks in the pre-Pro layout', () => {
    render(
      <SafeShieldContent
        recipient={emptyAnalysis}
        contract={emptyAnalysis}
        threat={emptyAnalysis}
        deadlock={emptyAnalysis}
        safeTx={safeTx}
        hypernativeAuth={hypernativeAuthStatusBuilder().build()}
        hasProFeatures
        isSafePro={false}
      />,
    )

    expect(screen.getByTestId('open-checks-list').nextElementSibling).toBe(screen.getByTestId('hypernative-login-line'))
  })

  it('offers the Hypernative login when there is no Pro check to show', () => {
    render(
      <SafeShieldContent
        recipient={emptyAnalysis}
        contract={emptyAnalysis}
        threat={emptyAnalysis}
        deadlock={emptyAnalysis}
        hypernativeAuth={hypernativeAuthStatusBuilder().build()}
        hasProFeatures
      />,
    )

    expect(screen.getByTestId('hypernative-login-line')).toBeInTheDocument()
    expect(screen.queryByTestId('pro-checks-section')).not.toBeInTheDocument()
  })

  it('hides the Hypernative login while the analysis skeleton shows', () => {
    render(
      <SafeShieldContent
        recipient={[undefined, undefined, true]}
        contract={emptyAnalysis}
        threat={emptyAnalysis}
        deadlock={emptyAnalysis}
        hypernativeAuth={hypernativeAuthStatusBuilder().build()}
        hasProFeatures
      />,
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.queryByTestId('hypernative-login-line')).not.toBeInTheDocument()
  })

  it('lets a user with their own Tenderly project run the simulation by hand', () => {
    mockHasOwnTenderly = true
    renderContent(false)

    expect(screen.queryByTestId('tenderly-simulation-locked')).not.toBeInTheDocument()
    expect(screen.getByTestId('tenderly-simulation')).toBeInTheDocument()
    expect(screen.getByTestId('run-simulation-btn')).toBeInTheDocument()
  })

  it('runs the simulation on its own with Safe Pro, with no Run button', () => {
    renderContent(true)

    expect(screen.getByTestId('tenderly-simulation')).toBeInTheDocument()
    expect(screen.queryByTestId('run-simulation-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tenderly-simulation-locked')).not.toBeInTheDocument()
  })

  it('falls back from the automatic simulation to the locked row when the Safe loses Safe Pro', () => {
    const { rerender } = renderContent(true)
    expect(screen.getByTestId('tenderly-simulation')).toBeInTheDocument()

    rerender(
      <SafeShieldContent
        recipient={emptyAnalysis}
        contract={emptyAnalysis}
        threat={emptyAnalysis}
        deadlock={emptyAnalysis}
        safeTx={safeTx}
        hasProFeatures={false}
      />,
    )

    expect(screen.queryByTestId('tenderly-simulation')).not.toBeInTheDocument()
    expect(screen.getByTestId('tenderly-simulation-locked')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set' })).toBeInTheDocument()
    expect(screen.getByTestId('pro-upgrade-link')).toBeInTheDocument()
  })

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

  it('locks the contract check behind an upgrade without Safe Pro when the transaction calls a contract', () => {
    render(
      <SafeShieldContent
        recipient={emptyAnalysis}
        contract={emptyAnalysis}
        threat={emptyAnalysis}
        deadlock={emptyAnalysis}
        safeTx={contractCallTx}
        hasProFeatures={false}
      />,
    )

    expect(screen.getByTestId('pro-checks-section')).toContainElement(screen.getByTestId('contract-analysis-locked'))
    expect(screen.getByTestId('contract-analysis-locked')).toHaveTextContent('Known contract')
    expect(screen.queryByTestId('contract-analysis-group-card')).not.toBeInTheDocument()
  })

  it('leaves the locked contract check out of a native transfer without Safe Pro', () => {
    renderContent(false)

    expect(screen.queryByTestId('contract-analysis-locked')).not.toBeInTheDocument()
  })

  it('shows the contract check result instead of the locked row with Safe Pro', () => {
    render(
      <SafeShieldContent
        recipient={emptyAnalysis}
        contract={ContractAnalysisBuilder.verifiedContract().build()}
        threat={emptyAnalysis}
        deadlock={emptyAnalysis}
        safeTx={contractCallTx}
        hasProFeatures
      />,
    )

    expect(screen.getByTestId('pro-checks-section')).toContainElement(
      screen.getByTestId('contract-analysis-group-card'),
    )
    expect(screen.queryByTestId('contract-analysis-locked')).not.toBeInTheDocument()
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

  it.each([true, false])(
    'shows only the threat analysis on an off-chain message, with no Pro section (hasProFeatures: %s)',
    (hasProFeatures) => {
      render(
        <SafeShieldContent
          recipient={emptyAnalysis}
          contract={emptyAnalysis}
          threat={ThreatAnalysisBuilder.noThreat()}
          deadlock={emptyAnalysis}
          hasProFeatures={hasProFeatures}
          isOffchainMessage
        />,
      )

      expect(screen.getByTestId('threat-analysis-group-card')).toBeInTheDocument()
      expect(screen.queryByTestId('pro-checks-section')).not.toBeInTheDocument()
      expect(screen.queryByTestId('pro-checks-row')).not.toBeInTheDocument()
      expect(screen.queryByTestId('recipient-analysis-locked')).not.toBeInTheDocument()
      expect(screen.queryByTestId('tenderly-simulation-locked')).not.toBeInTheDocument()
      expect(screen.queryByTestId('tenderly-simulation')).not.toBeInTheDocument()
    },
  )
})
