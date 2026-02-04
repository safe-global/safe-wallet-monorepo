import { render } from '@testing-library/react'
import ObservabilityErrorBoundary from './index'

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ObservabilityErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ObservabilityErrorBoundary>
        <div>Test content</div>
      </ObservabilityErrorBoundary>,
    )

    expect(getByText('Test content')).toBeInTheDocument()
  })

  it('should render fallback UI when an error is thrown', () => {
    const { getByText } = render(
      <ObservabilityErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ObservabilityErrorBoundary>,
    )

    expect(getByText(/Something went wrong/i)).toBeInTheDocument()
  })

  it('should call onError callback when an error is caught', () => {
    const onError = jest.fn()

    render(
      <ObservabilityErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ObservabilityErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(String))
    expect(onError).toHaveBeenCalledTimes(1)

    const [error, componentStack] = onError.mock.calls[0]
    expect(error.message).toBe('Test error')
    expect(componentStack).toBeTruthy()
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error UI</div>

    const { getByText } = render(
      <ObservabilityErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ObservabilityErrorBoundary>,
    )

    expect(getByText('Custom error UI')).toBeInTheDocument()
  })

  it('should not call onError if no error occurs', () => {
    const onError = jest.fn()

    render(
      <ObservabilityErrorBoundary onError={onError}>
        <div>No error</div>
      </ObservabilityErrorBoundary>,
    )

    expect(onError).not.toHaveBeenCalled()
  })
})
