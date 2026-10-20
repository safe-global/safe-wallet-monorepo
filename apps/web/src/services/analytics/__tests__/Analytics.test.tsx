import { useEffect } from 'react'
import { render } from '@/tests/test-utils'
import local from '@/services/local-storage/local'
import { CookieAndTermType, cookiesAndTermsInitialState, cookiesAndTermsSlice } from '@/store/cookiesAndTermsSlice'
import { version } from '@/markdown/terms/version'
import { datadogRum } from '@datadog/browser-rum'
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

  it('should, when analytics consent is stored from an earlier visit, load Google Analytics before the mount effects of later components', () => {
    local.setItem(cookiesAndTermsSlice.name, {
      ...cookiesAndTermsInitialState,
      [CookieAndTermType.ANALYTICS]: true,
      termsVersion: version,
    })
    let isGaLoadedAtMount: boolean | undefined
    const LaterComponent = () => {
      useEffect(() => {
        isGaLoadedAtMount = document.getElementById('_next-ga-init') !== null
      }, [])
      return null
    }

    try {
      render(
        <>
          <Analytics />
          <LaterComponent />
        </>,
      )

      expect(isGaLoadedAtMount).toBe(true)
    } finally {
      local.removeItem(cookiesAndTermsSlice.name)
    }
  })

  it('should, when the user has not given analytics consent, keep Datadog tracking consent not granted', () => {
    jest.mocked(datadogRum.setTrackingConsent).mockClear()

    render(<Analytics />, {
      initialReduxState: {
        cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.ANALYTICS]: false, termsVersion: version },
      },
    })

    expect(datadogRum.setTrackingConsent).toHaveBeenCalledWith('not-granted')
    expect(datadogRum.setTrackingConsent).not.toHaveBeenCalledWith('granted')
  })

  it('should, when the user has given analytics consent, grant Datadog tracking consent', () => {
    jest.mocked(datadogRum.setTrackingConsent).mockClear()

    render(<Analytics />, {
      initialReduxState: {
        cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.ANALYTICS]: true, termsVersion: version },
      },
    })

    expect(datadogRum.setTrackingConsent).toHaveBeenLastCalledWith('granted')
  })
})
