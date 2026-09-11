import { renderHook } from '@/tests/test-utils'
import useLogError, { __resetUseLogErrorForTests } from '@/hooks/useLogError'
import { Errors, logError } from '@/services/exceptions'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockedLogError = logError as jest.MockedFunction<typeof logError>

describe('useLogError', () => {
  beforeEach(() => {
    mockedLogError.mockClear()
    __resetUseLogErrorForTests()
  })

  it('logs the failure once', () => {
    renderHook(() => useLogError(Errors._600, 'Failed to load safe info'))

    expect(mockedLogError).toHaveBeenCalledTimes(1)
    expect(mockedLogError).toHaveBeenCalledWith(Errors._600, 'Failed to load safe info', undefined)
  })

  it('does not log again when a failed poll rebuilds an identical error', () => {
    // The regression this hook exists for: RTK Query writes a new error object
    // on every rejection, so the value changes identity while saying the same thing.
    const { rerender } = renderHook(({ message }: { message?: string }) => useLogError(Errors._600, message), {
      initialProps: { message: new Error('Network request failed').message },
    })

    rerender({ message: new Error('Network request failed').message })
    rerender({ message: new Error('Network request failed').message })

    expect(mockedLogError).toHaveBeenCalledTimes(1)
  })

  it('logs again when the failure message changes', () => {
    const { rerender } = renderHook(({ message }: { message?: string }) => useLogError(Errors._600, message), {
      initialProps: { message: 'Error 500' },
    })

    rerender({ message: 'Error 503' })

    expect(mockedLogError).toHaveBeenCalledTimes(2)
  })

  it('logs again when the context changes, even for the same message', () => {
    const { rerender } = renderHook(
      ({ host }: { host: string }) => useLogError(Errors._612, 'estimateGas failed', { rpcHost: host }),
      { initialProps: { host: 'mainnet.infura.io' } },
    )

    rerender({ host: 'rpc.ankr.com' })

    expect(mockedLogError).toHaveBeenCalledTimes(2)
  })

  it('does not log while there is nothing to report', () => {
    const { rerender } = renderHook(({ message }: { message?: string }) => useLogError(Errors._600, message), {
      initialProps: { message: undefined },
    })

    rerender({ message: undefined })

    expect(mockedLogError).not.toHaveBeenCalled()
  })

  it('re-arms after a recovery, so the same failure returning is reported again', () => {
    const { rerender } = renderHook(({ message }: { message?: string }) => useLogError(Errors._600, message), {
      initialProps: { message: 'Error 500' as string | undefined },
    })
    expect(mockedLogError).toHaveBeenCalledTimes(1)

    rerender({ message: undefined })
    rerender({ message: 'Error 500' })

    expect(mockedLogError).toHaveBeenCalledTimes(2)
  })

  it('forwards the thrown value itself, so CodedException can still read the HTTP status off it', () => {
    // Flattening to `.message` would drop `httpStatus` and the Ledger device
    // details, both of which are recovered from the thrown value.
    const thrown = Object.assign(new Error('Request failed'), { status: 503 })

    renderHook(() => useLogError(Errors._600, thrown))

    expect(mockedLogError).toHaveBeenCalledWith(Errors._600, thrown, undefined)
  })

  it('does not log again when the thrown error is rebuilt with the same message', () => {
    const { rerender } = renderHook(({ thrown }: { thrown: unknown }) => useLogError(Errors._811, thrown), {
      initialProps: { thrown: new Error('Invalid owner structure') as unknown },
    })

    rerender({ thrown: new Error('Invalid owner structure') })
    rerender({ thrown: new Error('Invalid owner structure') })

    expect(mockedLogError).toHaveBeenCalledTimes(1)
  })

  it('logs again when a rebuilt error says something different', () => {
    const { rerender } = renderHook(({ thrown }: { thrown: unknown }) => useLogError(Errors._811, thrown), {
      initialProps: { thrown: new Error('Invalid owner structure') as unknown },
    })

    rerender({ thrown: new Error('Threshold exceeds owner count') })

    expect(mockedLogError).toHaveBeenCalledTimes(2)
  })

  it('treats null as nothing to report', () => {
    renderHook(() => useLogError(Errors._811, null))

    expect(mockedLogError).not.toHaveBeenCalled()
  })

  describe('concurrent owners', () => {
    // One failed gas estimation is read at once by the execute form, the fee
    // preview and the gas-too-high check. It is one failure, so it reports once —
    // without any of them having to be nominated as the reporter.
    const renderOwner = () => renderHook(() => useLogError(Errors._612, 'estimateGas failed'))

    it('reports once however many owners see the same failure', () => {
      renderOwner()
      renderOwner()
      renderOwner()

      expect(mockedLogError).toHaveBeenCalledTimes(1)
    })

    it('does not re-report when one owner unmounts while others still hold it', () => {
      const first = renderOwner()
      renderOwner()

      first.unmount()

      expect(mockedLogError).toHaveBeenCalledTimes(1)
    })

    it('reports again for an owner mounting after every previous one has gone', () => {
      const only = renderOwner()
      expect(mockedLogError).toHaveBeenCalledTimes(1)

      only.unmount()
      renderOwner()

      expect(mockedLogError).toHaveBeenCalledTimes(2)
    })

    it('does not collapse owners reporting genuinely different failures', () => {
      renderHook(() => useLogError(Errors._612, 'estimateGas failed'))
      renderHook(() => useLogError(Errors._612, 'network unreachable'))

      expect(mockedLogError).toHaveBeenCalledTimes(2)
    })
  })

  it('keeps a rebuilt but equivalent context from re-reporting', () => {
    // getRpcErrorContext returns a fresh object for some providers; keying on
    // identity would defeat the whole hook.
    const { rerender } = renderHook(() =>
      useLogError(Errors._609, 'loadSpendingLimits failed', {
        rpcHost: 'mainnet.infura.io',
        rpcEndpointKind: 'infura',
      }),
    )

    rerender()
    rerender()

    expect(mockedLogError).toHaveBeenCalledTimes(1)
  })
})
