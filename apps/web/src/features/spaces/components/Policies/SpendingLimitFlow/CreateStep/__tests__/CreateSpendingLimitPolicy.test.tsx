import { render, screen, fireEvent } from '@/tests/test-utils'
import { SafeScopeContext } from '@/components/tx-flow/safe-scope/context'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import { useSpendingLimitSafeAccounts } from '../../hooks/useSpendingLimitSafeAccounts'
import { createDefaultFormValues, type SpendingLimitPolicyFormValues } from '../../types'
import type { SpendingLimitPolicyFormProps } from '../SpendingLimitPolicyForm'
import CreateSpendingLimitPolicy from '..'

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const SPENDER = '0x1234567890123456789012345678901234567890'

jest.mock('../../hooks/useSpendingLimitSafeAccounts', () => ({ useSpendingLimitSafeAccounts: jest.fn() }))
jest.mock('@/features/safe-shield/SafeShieldContext', () => ({ useSafeShieldForAddressPoisoning: jest.fn() }))

// The form has its own suite; here only the wiring between flow context, scope and form is under test.
jest.mock('../SpendingLimitPolicyForm', () => ({
  __esModule: true,
  default: (props: SpendingLimitPolicyFormProps) => (
    <div
      data-testid="form"
      data-scope-key={props.scopeKey ?? ''}
      data-accounts={props.accounts.length}
      data-default-safe={props.defaultValues.safe}
      data-default-spenders={props.defaultValues.spenders.length}
    >
      <button type="button" onClick={() => props.onSafeChange('1', SAFE_A)}>
        pick safe
      </button>
      <button type="button" onClick={() => props.onSpendersChange?.([SPENDER])}>
        type spender
      </button>
      <button type="button" onClick={() => props.onSubmit({ ...props.defaultValues, safe: `1:${SAFE_A}` })}>
        submit
      </button>
    </div>
  ),
}))

const mockUseAccounts = useSpendingLimitSafeAccounts as jest.MockedFunction<typeof useSpendingLimitSafeAccounts>
const mockPoisoning = useSafeShieldForAddressPoisoning as jest.MockedFunction<typeof useSafeShieldForAddressPoisoning>

const renderStep = ({ data, scopeKey }: { data?: SpendingLimitPolicyFormValues; scopeKey?: string } = {}) => {
  const onNext = jest.fn()
  const setScope = jest.fn()
  const context: TxFlowContextType<SpendingLimitPolicyFormValues> = { ...initialContext, data, onNext }
  render(
    <SafeScopeContext.Provider
      value={{
        scope: scopeKey
          ? {
              chainId: '1',
              safeAddress: SAFE_A,
              scopeKey: scopeKey as `${string}:${string}`,
              safeLoaded: false,
              safeLoading: true,
            }
          : undefined,
        setScope,
        clearScope: jest.fn(),
      }}
    >
      <TxFlowContext.Provider value={context as TxFlowContextType}>
        <CreateSpendingLimitPolicy isCalloutDismissed={false} onDismissCallout={jest.fn()} />
      </TxFlowContext.Provider>
    </SafeScopeContext.Provider>,
  )
  return { onNext, setScope }
}

describe('CreateSpendingLimitPolicy', () => {
  beforeEach(() => {
    mockUseAccounts.mockReturnValue({
      accounts: [],
      isLoading: false,
      isError: false,
      hasWallet: true,
      refetch: jest.fn(),
    })
  })

  it('moves the SafeScope when the form picks a Safe', () => {
    const { setScope } = renderStep()

    fireEvent.click(screen.getByRole('button', { name: 'pick safe' }))

    expect(setScope).toHaveBeenCalledWith('1', SAFE_A)
  })

  it('hands the flow data and the scope key to the form and continues with the submitted values', () => {
    const data = { ...createDefaultFormValues(), safe: `1:${SAFE_A}` }
    const { onNext } = renderStep({ data, scopeKey: `1:${SAFE_A}` })

    const form = screen.getByTestId('form')
    expect(form).toHaveAttribute('data-scope-key', `1:${SAFE_A}`)
    // Stored data round-trips into defaultValues — this is what keeps step-1 input when Back is pressed.
    expect(form).toHaveAttribute('data-default-safe', `1:${SAFE_A}`)
    expect(form).toHaveAttribute('data-default-spenders', '1')
    fireEvent.click(screen.getByRole('button', { name: 'submit' }))

    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({ safe: `1:${SAFE_A}` }))
  })

  it('falls back to createDefaultFormValues when the flow has no stored data yet', () => {
    renderStep()

    expect(screen.getByTestId('form')).toHaveAttribute('data-default-safe', '')
  })

  it('registers the typed spender addresses for the address-poisoning check', () => {
    renderStep()

    fireEvent.click(screen.getByRole('button', { name: 'type spender' }))

    expect(mockPoisoning).toHaveBeenLastCalledWith([SPENDER])
  })
})
