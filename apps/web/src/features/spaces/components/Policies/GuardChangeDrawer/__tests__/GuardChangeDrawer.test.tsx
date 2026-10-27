import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { useChain } from '@/hooks/useChains'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import type { PendingGuardChange } from '@safe-global/views/features/spaces/components/Policies/types'
import { mapPendingGuardChanges } from '../../utils/mapPendingGuardChanges'
import { computeConfigureRoot } from '../../shared/guardTx'
import { mockAllowlistConfiguration, mockDelayedGuardDto, mockPendingTransactionDto } from '../../mocks/pendingPolicies'
import GuardChangeDrawer from '..'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [], loading: false })),
  useChain: jest.fn(),
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(() => false),
}))

const mockUseChain = jest.mocked(useChain)

const CONFIGURATIONS = [mockAllowlistConfiguration()]
const ROOT = computeConfigureRoot(CONFIGURATIONS)
const nowSec = () => Math.floor(Date.now() / 1000)

const rowOf = (overrides: Parameters<typeof mockDelayedGuardDto>[0]): PendingGuardChange =>
  mapPendingGuardChanges([mockDelayedGuardDto({ root: ROOT, configurations: CONFIGURATIONS, ...overrides })])[0]

const renderDrawer = (policy: PendingGuardChange, setTxFlow = jest.fn()) =>
  renderWithUserEvent(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() } as TxModalContextType}>
      <GuardChangeDrawer policy={policy} onClose={jest.fn()} />
    </TxModalContext.Provider>,
  )

const stateOf = (id: string) => screen.getByTestId(`guard-setup-step-${id}`).getAttribute('data-state')

describe('GuardChangeDrawer', () => {
  beforeEach(() => {
    mockUseChain.mockReturnValue(chainBuilder().with({ chainId: '11155111', shortName: 'sep' }).build())
  })

  it('shows the request as the current step while it collects signatures, and links to it', () => {
    const transaction = mockPendingTransactionDto({ confirmations: 1 })
    render(
      <GuardChangeDrawer
        policy={rowOf({ status: 'configuration-in-signing', readyAt: null, expiresAt: null, transaction })}
        onClose={jest.fn()}
      />,
    )

    expect(screen.getByTestId('policy-status-needs-signatures')).toBeInTheDocument()
    expect([stateOf('request'), stateOf('delay'), stateOf('apply')]).toEqual(['current', 'upcoming', 'upcoming'])
    expect(screen.getByText('1 of 2 signatures.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review transaction' })).toHaveAttribute(
      'href',
      expect.stringContaining(`id=multisig_${mockDelayedGuardDto().safe.address}_${transaction.safeTxHash}`),
    )
  })

  it('counts down the security delay and offers nothing to do', () => {
    renderDrawer(rowOf({ readyAt: nowSec() + 2 * 3_600 + 60, expiresAt: nowSec() + 48 * 3_600 }))

    expect(screen.getByTestId('policy-status-security-delay')).toBeInTheDocument()
    expect(stateOf('delay')).toBe('current')
    expect(screen.getByText(/^Ends in 2h 1m/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /apply/i })).not.toBeInTheDocument()
  })

  it('opens the apply transaction once the delay has passed', async () => {
    const setTxFlow = jest.fn()
    const { user } = renderDrawer(rowOf({ readyAt: nowSec() - 60, expiresAt: nowSec() + 3_600 }), setTxFlow)

    expect(screen.getByTestId('policy-status-ready-to-apply')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Apply change' }))

    expect(setTxFlow).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ subtitle: 'Apply policy change' }) }),
    )
  })

  it('offers to request an expired change again', () => {
    renderDrawer(rowOf({ status: 'expired', readyAt: nowSec() - 7_200, expiresAt: nowSec() - 60 }))

    expect(stateOf('apply')).toBe('failed')
    expect(screen.getByText('Expired on')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Request again' })).toBeEnabled()
  })

  it('cannot continue a change whose details CGW does not hold', () => {
    renderDrawer(rowOf({ configurations: null, readyAt: nowSec() - 60, expiresAt: nowSec() + 3_600 }))

    expect(screen.getByText(/weren't saved, so only its progress can be shown/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply change' })).toBeDisabled()
  })
})
