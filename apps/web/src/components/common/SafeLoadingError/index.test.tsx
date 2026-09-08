import { http, HttpResponse } from 'msw'
import { render } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useSafeLegalBlockMessageHook from '@/hooks/useSafeLegalBlockMessage'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import SafeLoadingError, { GENERIC_LOADING_ERROR } from '.'

const SAFE_ADDRESS = '0x87a57cBf742CC1Fc702D0E9BF595b1E056693e2f'
const LEGAL_BLOCK_MESSAGE = 'Unavailable for legal reasons'

const mockSafeInfo = (safeError?: string) => {
  jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
    safe: extendedSafeInfoBuilder().build(),
    safeAddress: SAFE_ADDRESS,
    safeLoaded: !safeError,
    safeLoading: false,
    safeError,
  })
}

const mockLegalBlockMessage = (message?: string) => {
  jest.spyOn(useSafeLegalBlockMessageHook, 'default').mockReturnValue(message)
}

// `useSafeAddressFromUrl` reads the `safe` query param, so the real hook only
// issues its request when the router carries one.
const safeInUrl = { routerProps: { query: { safe: `eth:${SAFE_ADDRESS}` } } }

describe('SafeLoadingError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLegalBlockMessage(undefined)
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

  it('shows the backend reason when the Safe is blocked for legal reasons', async () => {
    mockSafeInfo('Error 451')
    // No `mockLegalBlockMessage` — the real hook reads a real 451 off MSW, so this
    // covers the component→hook wiring and not just the render given a message.
    jest.spyOn(useSafeLegalBlockMessageHook, 'default').mockRestore()
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, () =>
        HttpResponse.json({ code: 451, message: LEGAL_BLOCK_MESSAGE }, { status: 451 }),
      ),
    )

    const { findByText, getByTestId, queryByText } = render(
      <SafeLoadingError>
        <div>Safe content</div>
      </SafeLoadingError>,
      safeInUrl,
    )

    expect(await findByText(LEGAL_BLOCK_MESSAGE)).toBeInTheDocument()
    expect(queryByText(GENERIC_LOADING_ERROR)).not.toBeInTheDocument()
    expect(getByTestId('safe-loading-error')).toBeInTheDocument()
    expect(getByTestId('safe-loading-error-cta')).toBeInTheDocument()
  })
})
