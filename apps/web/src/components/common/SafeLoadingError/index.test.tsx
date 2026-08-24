import { render } from '@/tests/test-utils'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useSafeLegalBlockMessageHook from '@/hooks/useSafeLegalBlockMessage'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import SafeLoadingError, { GENERIC_LOADING_ERROR } from '.'

const mockSafeInfo = (safeError?: string) => {
  jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
    safe: extendedSafeInfoBuilder().build(),
    safeAddress: '0x0000000000000000000000000000000000005AFE',
    safeLoaded: !safeError,
    safeLoading: false,
    safeError,
  })
}

const mockLegalBlockMessage = (message?: string) => {
  jest.spyOn(useSafeLegalBlockMessageHook, 'default').mockReturnValue(message)
}

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

  it('shows the backend reason when the Safe is blocked for legal reasons', () => {
    mockSafeInfo('Error 451')
    mockLegalBlockMessage('Unavailable for legal reasons')

    const { getByText, getByTestId, queryByText } = render(
      <SafeLoadingError>
        <div>Safe content</div>
      </SafeLoadingError>,
    )

    expect(getByText('Unavailable for legal reasons')).toBeInTheDocument()
    expect(queryByText(GENERIC_LOADING_ERROR)).not.toBeInTheDocument()
    // Test IDs the Cypress spec selects on
    expect(getByTestId('safe-loading-error')).toBeInTheDocument()
    expect(getByTestId('safe-loading-error-cta')).toBeInTheDocument()
  })
})
