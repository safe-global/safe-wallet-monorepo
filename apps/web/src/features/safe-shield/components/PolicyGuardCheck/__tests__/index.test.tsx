import { render, screen } from '@/tests/test-utils'
import type { GuardCheckResult } from '@safe-global/utils/services/policy-guard'
import PolicyGuardCheck from '../index'

describe('PolicyGuardCheck', () => {
  it('renders nothing without a verdict', () => {
    const { container } = render(<PolicyGuardCheck isAllowed={false} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the pass entry when the policies permit the transaction', () => {
    render(<PolicyGuardCheck isAllowed />)

    expect(screen.getByTestId('policy-guard-check')).toHaveTextContent('Policy checks passed')
  })

  it.each<GuardCheckResult>([
    { status: 'no-policy' },
    { status: 'denied', policy: '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187', reason: 'Unauthorized' },
  ])('says the transaction will be refused on a $status refusal', (blocked) => {
    render(<PolicyGuardCheck blocked={blocked} isAllowed={false} />)

    expect(screen.getByTestId('policy-guard-check')).toHaveTextContent(
      "This account's policies will refuse this transaction.",
    )
  })

  it.each([
    ['NonZeroGasPrice', "This transaction includes a gas refund, which this account's policies don't allow."],
    ['NonZeroSafeTxGas', 'Set it to 0 under advanced parameters.'],
    ['GuardTargetDenied', 'Policy settings can only be requested, applied or cancelled, with no funds attached.'],
    ['ModuleConfigurationDenied', "Policies can't be changed through a module. Use a regular Safe transaction."],
  ])('explains a %s refusal', (reason, message) => {
    render(<PolicyGuardCheck blocked={{ status: 'unsupported', reason }} isAllowed={false} />)

    expect(screen.getByTestId('policy-guard-check')).toHaveTextContent(message)
  })

  it('falls back to the general refusal for an unsupported shape it has no copy for', () => {
    render(<PolicyGuardCheck blocked={{ status: 'unsupported', reason: 'SomethingNew' }} isAllowed={false} />)

    expect(screen.getByTestId('policy-guard-check')).toHaveTextContent(
      "This account's policies will refuse this transaction.",
    )
  })
})
