import { renderHook } from '@/tests/test-utils'
import useLogErrorOnce from '@/hooks/useLogErrorOnce'
import { Errors, logError } from '@/services/exceptions'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockedLogError = logError as jest.MockedFunction<typeof logError>

describe('useLogErrorOnce', () => {
  beforeEach(() => {
    mockedLogError.mockClear()
  })

  it('logs the failure once', () => {
    renderHook(() => useLogErrorOnce(Errors._600, 'Failed to load safe info'))

    expect(mockedLogError).toHaveBeenCalledTimes(1)
    expect(mockedLogError).toHaveBeenCalledWith(Errors._600, 'Failed to load safe info', undefined)
  })

  it('does not log again when a failed poll rebuilds an identical error', () => {
    // The regression this hook exists for: RTK Query writes a new error object
    // on every rejection, so the value changes identity while saying the same thing.
    const { rerender } = renderHook(({ message }: { message?: string }) => useLogErrorOnce(Errors._600, message), {
      initialProps: { message: new Error('Network request failed').message },
    })

    rerender({ message: new Error('Network request failed').message })
    rerender({ message: new Error('Network request failed').message })

    expect(mockedLogError).toHaveBeenCalledTimes(1)
  })

  it('logs again when the failure message changes', () => {
    const { rerender } = renderHook(({ message }: { message?: string }) => useLogErrorOnce(Errors._600, message), {
      initialProps: { message: 'Error 500' },
    })

    rerender({ message: 'Error 503' })

    expect(mockedLogError).toHaveBeenCalledTimes(2)
  })

  it('logs again when the context changes, even for the same message', () => {
    const { rerender } = renderHook(
      ({ host }: { host: string }) => useLogErrorOnce(Errors._612, 'estimateGas failed', { rpcHost: host }),
      { initialProps: { host: 'mainnet.infura.io' } },
    )

    rerender({ host: 'rpc.ankr.com' })

    expect(mockedLogError).toHaveBeenCalledTimes(2)
  })

  it('does not log while there is nothing to report', () => {
    const { rerender } = renderHook(({ message }: { message?: string }) => useLogErrorOnce(Errors._600, message), {
      initialProps: { message: undefined },
    })

    rerender({ message: undefined })

    expect(mockedLogError).not.toHaveBeenCalled()
  })

  it('re-arms after a recovery, so the same failure returning is reported again', () => {
    const { rerender } = renderHook(({ message }: { message?: string }) => useLogErrorOnce(Errors._600, message), {
      initialProps: { message: 'Error 500' as string | undefined },
    })
    expect(mockedLogError).toHaveBeenCalledTimes(1)

    rerender({ message: undefined })
    rerender({ message: 'Error 500' })

    expect(mockedLogError).toHaveBeenCalledTimes(2)
  })

  it('keeps a rebuilt but equivalent context from re-reporting', () => {
    // getRpcErrorContext returns a fresh object for some providers; keying on
    // identity would defeat the whole hook.
    const { rerender } = renderHook(() =>
      useLogErrorOnce(Errors._609, 'loadSpendingLimits failed', {
        rpcHost: 'mainnet.infura.io',
        rpcEndpointKind: 'infura',
      }),
    )

    rerender()
    rerender()

    expect(mockedLogError).toHaveBeenCalledTimes(1)
  })
})
