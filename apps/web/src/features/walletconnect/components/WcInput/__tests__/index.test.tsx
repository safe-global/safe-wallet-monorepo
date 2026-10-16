import { useState } from 'react'
import { render, screen, fireEvent, act, waitFor } from '@/tests/test-utils'
import WcInput, { PROPOSAL_TIMEOUT } from '../index'
import { WalletConnectContext } from '../../WalletConnectContext'
import { WCLoadingState } from '../../../types'
import type { WalletConnectContextType } from '../../../types'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const VALID_URI =
  'wc:fd5dd4d244d0bb641267f66d04d56390a4aec2206a2c435c082d458887160f96@2?expiryTimestamp=1786349730&relay-protocol=irn&symKey=c1f94e99a986e7928f6c4b95b5653d9316cb371e31ef5bc81be784e388e8b34e'

const mockConnect = jest.fn()
const mockSetLoading = jest.fn()
const mockSetError = jest.fn()

const makeContext = (
  loading: WCLoadingState | null = null,
  isSuggestionFeatureEnabled = true,
): WalletConnectContextType =>
  ({
    isSuggestionFeatureEnabled,
    walletConnect: { connect: mockConnect },
    sessions: [],
    sessionProposal: null,
    error: null,
    setError: mockSetError,
    open: true,
    setOpen: jest.fn(),
    loading,
    setLoading: mockSetLoading,
    approveSession: jest.fn(),
    rejectSession: jest.fn(),
    matchingSafeApp: undefined,
    isMatchingSafeAppLoading: false,
  }) as unknown as WalletConnectContextType

let setLoadingFromTest: ((next: WCLoadingState | null) => void) | undefined

/** Exposes the harness's setter so a test can simulate the proposal arriving mid-flight. */
const render_StatefulWithControl = () => {
  render(<StatefulHarness />)
  return { setLoadingExternally: (next: WCLoadingState | null) => setLoadingFromTest?.(next) }
}

const renderInput = (loading: WCLoadingState | null = null, uri = '') =>
  render(
    <WalletConnectContext.Provider value={makeContext(loading)}>
      <WcInput uri={uri} />
    </WalletConnectContext.Provider>,
  )

/**
 * Mirrors the real flow, where loading starts as null and only becomes CONNECT once
 * onInput runs. A context with loading pinned upfront hides the stale-closure bug.
 */
const StatefulHarness = ({ uri = '' }: { uri?: string }) => {
  const [loading, setLoading] = useState<WCLoadingState | null>(null)
  setLoadingFromTest = setLoading

  const value = {
    ...makeContext(loading),
    loading,
    setLoading: (next: WCLoadingState | null) => {
      mockSetLoading(next)
      setLoading(next)
    },
  } as unknown as WalletConnectContextType

  return (
    <WalletConnectContext.Provider value={value}>
      <WcInput uri={uri} />
    </WalletConnectContext.Provider>
  )
}

describe('WcInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockConnect.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('connects with a valid pairing code', async () => {
    renderInput()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: VALID_URI } })

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledWith(VALID_URI)
    })
    expect(mockSetLoading).toHaveBeenCalledWith(WCLoadingState.CONNECT)
  })

  it('rejects an invalid pairing code without connecting', () => {
    renderInput()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'not-a-uri' } })

    expect(mockConnect).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Invalid pairing code')).toBeInTheDocument()
  })

  // Regression: the timeout used to read `loading` from a stale closure, which on a fresh
  // attempt was null, so it never fired and a reused pairing code spun forever
  it('times out when no proposal arrives, e.g. for an already used pairing code', async () => {
    render(<StatefulHarness />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: VALID_URI } })

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled()
    })
    expect(mockSetLoading).toHaveBeenCalledWith(WCLoadingState.CONNECT)

    await act(async () => {
      jest.advanceTimersByTime(PROPOSAL_TIMEOUT)
    })

    expect(mockSetError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Connection timed out') }),
    )
    expect(mockSetLoading).toHaveBeenLastCalledWith(null)
  })

  // Pinning loading to APPROVE up front would pass against the stale-closure bug too, so the
  // state has to transition the way it does in the real flow: null -> CONNECT -> APPROVE
  it('does not time out once a proposal is being approved', async () => {
    const { setLoadingExternally } = render_StatefulWithControl()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: VALID_URI } })

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled()
    })
    expect(mockSetLoading).toHaveBeenCalledWith(WCLoadingState.CONNECT)

    // The proposal arrived and approval started before the timer fires
    act(() => setLoadingExternally(WCLoadingState.APPROVE))

    await act(async () => {
      jest.advanceTimersByTime(PROPOSAL_TIMEOUT)
    })

    expect(mockSetError).not.toHaveBeenCalled()
  })

  // The timer could never fire before this branch, so with the feature off it stays unarmed
  it('does not time out when the feature is off', async () => {
    render(
      <WalletConnectContext.Provider value={makeContext(WCLoadingState.CONNECT, false)}>
        <WcInput uri="" />
      </WalletConnectContext.Provider>,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: VALID_URI } })

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled()
    })

    await act(async () => {
      jest.advanceTimersByTime(PROPOSAL_TIMEOUT * 10)
    })

    expect(mockSetError).not.toHaveBeenCalled()
  })

  it('surfaces a connect failure on the input', async () => {
    mockConnect.mockRejectedValue(new Error('Pairing already exists'))

    renderInput()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: VALID_URI } })

    await waitFor(() => {
      expect(screen.getByLabelText('Pairing already exists')).toBeInTheDocument()
    })
  })

  it('connects only once for a pre-filled uri', async () => {
    renderInput(null, VALID_URI)

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledWith(VALID_URI)
    })
    expect(mockConnect).toHaveBeenCalledTimes(1)
  })
})
