import { render } from '@/tests/test-utils'
import { CookieAndTermType, cookiesAndTermsInitialState } from '@/store/cookiesAndTermsSlice'
import { version } from '@/markdown/terms/version'
import Analytics from '../Analytics'

describe('Analytics', () => {
  beforeAll(() => {
    // jsdom has no performance.mark, which GoogleAnalytics calls on mount
    Object.defineProperty(window.performance, 'mark', { value: jest.fn(), configurable: true })
  })

  it('should, when the user has not given analytics consent, not load Google Analytics', () => {
    document.getElementById('_next-ga-init')?.remove()

    render(<Analytics />, {
      initialReduxState: {
        cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.ANALYTICS]: false, termsVersion: version },
      },
    })

    expect(document.getElementById('_next-ga-init')).toBeNull()
  })

  it('should, when the user has given analytics consent, load Google Analytics', () => {
    render(<Analytics />, {
      initialReduxState: {
        cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.ANALYTICS]: true, termsVersion: version },
      },
    })

    expect(document.getElementById('_next-ga-init')).not.toBeNull()
  })
})
