import { render, screen } from '@/tests/test-utils'
import type { GuardAction, GuardCheckResult } from '@safe-global/utils/services/policy-guard'
import * as checkHook from '../../../hooks/useGuardPolicyCheck'
import PolicyGuardCheck from '../index'

const CALL = { to: '0x1111111111111111111111111111111111111111', value: '0', data: '0x', operation: 0 }

const mockCheck = (over: Partial<ReturnType<typeof checkHook.useGuardPolicyChecks>>) =>
  jest.spyOn(checkHook, 'useGuardPolicyChecks').mockReturnValue({
    isAllowed: false,
    isApplicable: true,
    isLoading: false,
    ...over,
  })

const blockedBy = (result: GuardCheckResult, action: GuardAction = 'erc20-transfer') => ({
  blocked: { result, action, call: CALL },
})

describe('PolicyGuardCheck', () => {
  afterEach(() => jest.restoreAllMocks())

  // A Safe with no recognised policy guard has no verdict, so the Copilot says nothing.
  it('renders nothing when there is no guard to ask', () => {
    mockCheck({ isApplicable: false })
    const { container } = render(<PolicyGuardCheck calls={[CALL]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing while the check is still running', () => {
    mockCheck({ isLoading: true })
    const { container } = render(<PolicyGuardCheck calls={[CALL]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('confirms a transaction the policies permit', () => {
    mockCheck({ isAllowed: true })
    render(<PolicyGuardCheck calls={[CALL]} />)

    expect(screen.getByTestId('policy-guard-check')).toHaveTextContent(/permits this transaction/i)
    expect(screen.queryByTestId('policy-guard-fix')).not.toBeInTheDocument()
  })

  it('says a blocked transaction is blocked, and how to permit it', () => {
    mockCheck(blockedBy({ status: 'no-policy' }))
    render(<PolicyGuardCheck calls={[CALL]} />)

    expect(screen.getByTestId('policy-guard-check')).toHaveTextContent(/no policy covers this action/i)
    expect(screen.getByTestId('policy-guard-fix')).toHaveTextContent(/allowlist/i)
  })

  // An action the engine does not model cannot be fixed by one of the offered policies.
  it('asks for a custom policy when the action is not one the engine models', () => {
    mockCheck(blockedBy({ status: 'no-policy' }, 'other'))
    render(<PolicyGuardCheck calls={[CALL]} />)

    expect(screen.getByTestId('policy-guard-fix')).toHaveTextContent(/custom policy/i)
  })

  it('stays silent when nothing has been composed yet', () => {
    mockCheck({})
    const { container } = render(<PolicyGuardCheck calls={undefined} />)

    expect(container).toBeEmptyDOMElement()
  })
})
