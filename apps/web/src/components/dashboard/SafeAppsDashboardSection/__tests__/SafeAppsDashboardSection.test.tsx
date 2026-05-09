import { render, screen, waitFor } from '@/tests/test-utils'
import SafeAppsDashboardSection from '@/components/dashboard/SafeAppsDashboardSection/SafeAppsDashboardSection'
import { LS_NAMESPACE } from '@/config/constants'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import {
  compoundSafeApp,
  ensSafeApp,
  synthetixSafeApp,
  transactionBuilderSafeApp,
} from '@safe-global/test/msw/mockSafeApps'

// Create featured versions of the apps for this test suite
const featuredApps = [
  { ...compoundSafeApp, featured: true },
  { ...ensSafeApp, featured: true },
  { ...synthetixSafeApp, featured: false },
  { ...transactionBuilderSafeApp, featured: true },
]

describe('Safe Apps Dashboard Section', () => {
  beforeEach(() => {
    window.localStorage.clear()
    const mostUsedApps = JSON.stringify({
      24: {
        openCount: 2,
        timestamp: 1663779409409,
        txCount: 1,
      },
      3: {
        openCount: 1,
        timestamp: 1663779409409,
        txCount: 0,
      },
    })
    window.localStorage.setItem(`${LS_NAMESPACE}SafeApps__dashboard`, mostUsedApps)

    // Override the default safe-apps handler to return featured apps
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safe-apps`, ({ request }) => {
        const url = new URL(request.url)
        const appUrl = url.searchParams.get('url')

        // If filtering by URL, return matching apps
        if (appUrl) {
          const matchingApp = featuredApps.find(
            (app) => app.url === appUrl || app.url === appUrl.replace(/\/$/, '') || `${app.url}/` === appUrl,
          )
          return HttpResponse.json(matchingApp ? [matchingApp] : [])
        }

        // Return featured apps by default
        return HttpResponse.json(featuredApps)
      }),
    )
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('should display the Safe Apps Section', async () => {
    render(<SafeAppsDashboardSection />)

    await waitFor(() => expect(screen.getByText('Featured Apps')).toBeInTheDocument())
  })

  it('should display Safe Apps Cards (Name & Description)', async () => {
    render(<SafeAppsDashboardSection />)

    await waitFor(() => expect(screen.getByText('Compound')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('ENS App')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Transaction Builder')).toBeInTheDocument())
  })
})
