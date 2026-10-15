import { render, screen } from '@/tests/test-utils'
import type { GuardCheckResult } from '@safe-global/utils/services/policy-guard'
import * as checkHook from '../../../hooks/useGuardPolicyCheck'
import PolicyGuardCheck from '../index'

const safeTx = { data: { to: '0x1', value: '0', data: '0x', operation: 0 } } as never

const mockCheck = (result: GuardCheckResult | undefined, action: 'erc20-transfer' | 'other' = 'erc20-transfer') =>
  jest.spyOn(checkHook, 'useGuardPolicyCheck').mockReturnValue({ result, action, isLoading: false })

describe('PolicyGuardCheck', () => {
  afterEach(() => jest.restoreAllMocks())

  // A Safe with no recognised policy guard has no verdict, so the Copilot says nothing.
  it('renders nothing when there is no guard to ask', () => {
    mockCheck(undefined)
    const { container } = render(<PolicyGuardCheck safeTx={safeTx} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing while the check is still running', () => {
    jest.spyOn(checkHook, 'useGuardPolicyCheck').mockReturnValue({ isLoading: true })
    const { container } = render(<PolicyGuardCheck safeTx={safeTx} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('confirms a transaction the policies permit', () => {
    mockCheck({ status: 'allowed' })
    render(<PolicyGuardCheck safeTx={safeTx} />)

    expect(screen.getByTestId('policy-guard-check')).toHaveTextContent(/permits this transaction/i)
    expect(screen.queryByTestId('policy-guard-fix')).not.toBeInTheDocument()
  })

  it('says a blocked transaction is blocked, and how to permit it', () => {
    mockCheck({ status: 'no-policy' })
    render(<PolicyGuardCheck safeTx={safeTx} />)

    expect(screen.getByTestId('policy-guard-check')).toHaveTextContent(/no policy covers this action/i)
    expect(screen.getByTestId('policy-guard-fix')).toHaveTextContent(/allowlist/i)
  })

  // An action the engine does not model cannot be fixed by one of the offered policies.
  it('asks for a custom policy when the action is not one the engine models', () => {
    mockCheck({ status: 'no-policy' }, 'other')
    render(<PolicyGuardCheck safeTx={safeTx} />)

    expect(screen.getByTestId('policy-guard-fix')).toHaveTextContent(/custom policy/i)
  })

  // An unreadable revert must never be shown as a verdict about the user's transaction.
  it('stays silent when the verdict could not be read', () => {
    mockCheck({ status: 'unknown' })
    const { container } = render(<PolicyGuardCheck safeTx={safeTx} />)

    expect(container).toBeEmptyDOMElement()
  })
})
