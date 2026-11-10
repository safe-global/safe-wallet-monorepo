import { render, screen, fireEvent } from '@/tests/test-utils'
import DelegationErrorBoundary from '../DelegationErrorBoundary'

let shouldThrow = true

const FlakyChild = () => {
  if (shouldThrow) throw new Error('Unexpected delegation shape')
  return <p>Delegation loaded</p>
}

describe('DelegationErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders its children when they do not throw', () => {
    shouldThrow = false

    render(
      <DelegationErrorBoundary>
        <FlakyChild />
      </DelegationErrorBoundary>,
    )

    expect(screen.getByText('Delegation loaded')).toBeInTheDocument()
  })

  it('shows the fallback message with the error when a child throws', () => {
    render(
      <DelegationErrorBoundary fallbackMessage="Failed to load pending delegations.">
        <FlakyChild />
      </DelegationErrorBoundary>,
    )

    expect(screen.getByText('Failed to load pending delegations.')).toBeInTheDocument()
    expect(screen.getByText('Unexpected delegation shape')).toBeInTheDocument()
  })

  it('shows a generic message when no fallback message is given', () => {
    render(
      <DelegationErrorBoundary>
        <FlakyChild />
      </DelegationErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong loading this content.')).toBeInTheDocument()
  })

  it('retries and renders the children again on Try again', () => {
    const onRetry = jest.fn()
    render(
      <DelegationErrorBoundary onRetry={onRetry}>
        <FlakyChild />
      </DelegationErrorBoundary>,
    )

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Delegation loaded')).toBeInTheDocument()
  })
})
