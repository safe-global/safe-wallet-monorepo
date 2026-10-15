import { render } from '@/tests/test-utils'
import Analytics from '../Analytics'

describe('Analytics', () => {
  it('should, when mounted, inject a GA consent default that denies analytics storage before the GA config', () => {
    // jsdom has no performance.mark, which GoogleAnalytics calls on mount
    Object.defineProperty(window.performance, 'mark', { value: jest.fn(), configurable: true })

    render(<Analytics />)

    const consentScript = document.getElementById('ga-consent-default')
    const gaInitScript = document.getElementById('_next-ga-init')

    expect(consentScript).not.toBeNull()
    expect(gaInitScript).not.toBeNull()
    expect(consentScript!.compareDocumentPosition(gaInitScript!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(consentScript!.innerHTML).toContain("gtag('consent', 'default'")
    expect(consentScript!.innerHTML).toContain("analytics_storage: 'denied'")
  })
})
