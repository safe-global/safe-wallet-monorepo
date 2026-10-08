import { render, screen } from '@/tests/test-utils'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import type { SpendingLimitState } from '@/features/spending-limits'
import BaselineGate, { BASELINE_LOAD_ERROR } from '../BaselineGate'

const limits: SpendingLimitState[] = [spendingLimitStateBuilder().build()]

const renderGate = (props: Partial<Parameters<typeof BaselineGate>[0]> = {}) =>
  render(<BaselineGate {...props}>{(baseline) => <div data-testid="form">{baseline.length} limits</div>}</BaselineGate>)

describe('BaselineGate', () => {
  it('hands the loaded limits to the form', () => {
    renderGate({ limits })

    expect(screen.getByTestId('form')).toHaveTextContent('1 limits')
  })

  it('keeps the form out of reach while the chain state is still unknown', () => {
    renderGate({})

    expect(screen.queryByTestId('form')).not.toBeInTheDocument()
  })

  it('refuses to open the form when the chain state could not be read', () => {
    renderGate({ error: new Error('rpc down') })

    expect(screen.queryByTestId('form')).not.toBeInTheDocument()
    expect(screen.getByText(BASELINE_LOAD_ERROR)).toBeInTheDocument()
  })
})
