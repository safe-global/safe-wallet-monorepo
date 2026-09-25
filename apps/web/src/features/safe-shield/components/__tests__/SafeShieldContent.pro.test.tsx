import { render, screen } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { RecipientAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import type { SafeTransaction } from '@safe-global/types-kit'
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
jest.mock('../HypernativeLoginLine', () => ({
  HypernativeLoginLine: () => <div data-testid="hypernative-login-line" />,
}))
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { chainId: '1', owners: [{ value: '0x00000000000000000000000000000000000000f1' }] } }),
}))

const emptyAnalysis: [undefined, undefined, boolean] = [undefined, undefined, false]
const safeTx = {
  data: { to: '0x00000000000000000000000000000000000000aa', value: '0', data: '0x', operation: 0 },
} as unknown as SafeTransaction
const renderContent = (hasProFeatures: boolean) =>
  render(
    <SafeShieldContent
      recipient={emptyAnalysis}
      contract={emptyAnalysis}
      threat={emptyAnalysis}
      deadlock={emptyAnalysis}
      safeTx={safeTx}
      hasProFeatures={hasProFeatures}
    />,
  )

describe('SafeShieldContent Safe Pro gating', () => {
  beforeEach(() => {
    mockHasOwnTenderly = false
  })

  it('keeps the pre-Pro layout while SAFE_PRO is off: recipient among the open checks, simulation by hand, no PRO block', () => {
    const recipient = RecipientAnalysisBuilder.knownRecipient(faker.finance.ethereumAddress()).build()
    render(
      <SafeShieldContent
        recipient={recipient}
        contract={emptyAnalysis}
        threat={emptyAnalysis}
        deadlock={emptyAnalysis}
        safeTx={safeTx}
        hasProFeatures
        isSafePro={false}
      />,
    )

    expect(screen.queryByTestId('pro-checks-section')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pro-checks-row')).not.toBeInTheDocument()
    expect(screen.queryByTestId('hypernative-login-line')).not.toBeInTheDocument()
    expect(screen.getByTestId('open-checks-list')).toContainElement(screen.getByTestId('recipient-analysis-group-card'))
    expect(screen.getByTestId('open-checks-list')).toContainElement(screen.getByTestId('tenderly-simulation'))
    expect(screen.getByTestId('run-simulation-btn')).toBeInTheDocument()
  })

  it('locks the simulation without Safe Pro and without a Tenderly project of one’s own', () => {
    renderContent(false)

    expect(screen.getByTestId('tenderly-simulation-locked')).toBeInTheDocument()
    expect(screen.queryByTestId('tenderly-simulation')).not.toBeInTheDocument()
    expect(screen.getByTestId('hypernative-login-line')).toBeInTheDocument()
  })

  it('groups the Pro checks after the open ones and leaves the Hypernative line out with Safe Pro', () => {
    const recipient = RecipientAnalysisBuilder.knownRecipient(faker.finance.ethereumAddress()).build()
    render(
      <SafeShieldContent
        recipient={recipient}
        contract={emptyAnalysis}
        threat={emptyAnalysis}
        deadlock={emptyAnalysis}
        safeTx={safeTx}
        hasProFeatures
      />,
    )

    const section = screen.getByTestId('pro-checks-section')
    expect(section).toContainElement(screen.getByTestId('recipient-analysis-group-card'))
    expect(section).toContainElement(screen.getByTestId('tenderly-simulation'))
    expect(section.previousElementSibling).toBe(screen.getByTestId('open-checks-list'))
    expect(section.nextElementSibling).toBeNull()
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
