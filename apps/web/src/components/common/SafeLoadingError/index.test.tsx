import { http, HttpResponse } from 'msw'
import { render } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useSafeUnavailableMessageHook from '@/hooks/useSafeUnavailableMessage'
import { SAFE_UNAVAILABLE_MESSAGE } from '@/utils/rtkQuery'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import SafeLoadingError, { GENERIC_LOADING_ERROR } from '.'

const SAFE_ADDRESS = '0x87a57cBf742CC1Fc702D0E9BF595b1E056693e2f'

const mockSafeInfo = (safeError?: string) => {
  jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
    safe: extendedSafeInfoBuilder().build(),
    safeAddress: SAFE_ADDRESS,
    safeLoaded: !safeError,
    safeLoading: false,
    safeError,
  })
}

const mockUnavailableMessage = (message?: string) => {
  jest.spyOn(useSafeUnavailableMessageHook, 'default').mockReturnValue(message)
}

// `useSafeAddressFromUrl` reads the `safe` query param, so the real hook only
// issues its request when the router carries one.
const safeInUrl = { routerProps: { query: { safe: `eth:${SAFE_ADDRESS}` } } }

describe('SafeLoadingError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUnavailableMessage(undefined)
  })

  it('renders children when the Safe loaded', () => {
    mockSafeInfo(undefined)

    const { getByText, queryByText } = render(
      <SafeLoadingError>
        <div>Safe content</div>
      </SafeLoadingError>,
    )

    expect(getByText('Safe content')).toBeInTheDocument()
    expect(queryByText(GENERIC_LOADING_ERROR)).not.toBeInTheDocument()
  })

  it('shows the generic message when loading the Safe failed', () => {
    mockSafeInfo('Error 500')

    const { getByText, queryByText } = render(
      <SafeLoadingError>
        <div>Safe content</div>
      </SafeLoadingError>,
    )

    expect(getByText(GENERIC_LOADING_ERROR)).toBeInTheDocument()
    expect(queryByText('Safe content')).not.toBeInTheDocument()
  })

  it('shows fixed copy when the Safe is blocked', async () => {
    mockSafeInfo('Error 451')
    // No mock — the real hook reads a real 451 off MSW, so this covers the
    // component→hook wiring and not just the render given a message.
    jest.spyOn(useSafeUnavailableMessageHook, 'default').mockRestore()
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, () =>
        HttpResponse.json({ code: 451, message: 'Blocked in your region by provider edge-node-7' }, { status: 451 }),
      ),
    )

    const { findByText, getByTestId, queryByText } = render(
      <SafeLoadingError>
        <div>Safe content</div>
      </SafeLoadingError>,
      safeInUrl,
    )

    expect(await findByText(SAFE_UNAVAILABLE_MESSAGE)).toBeInTheDocument()
    expect(queryByText('Blocked in your region by provider edge-node-7')).not.toBeInTheDocument()
    expect(queryByText(GENERIC_LOADING_ERROR)).not.toBeInTheDocument()
    expect(getByTestId('safe-loading-error')).toBeInTheDocument()
    expect(getByTestId('safe-loading-error-cta')).toBeInTheDocument()
  })
})
