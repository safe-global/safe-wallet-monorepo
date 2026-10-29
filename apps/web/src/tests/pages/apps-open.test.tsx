import { transactionBuilderSafeApp } from '@safe-global/test/msw/mockSafeApps'

import { render, screen } from '../test-utils'
import OpenSafeAppPage from '@/pages/apps/open'
import * as chainHooks from '@/hooks/useChains'
import * as manifest from '@/services/safe-apps/manifest'
import { chainBuilder } from '@/tests/builders/chains'

const SAFE = 'matic:0x0000000000000000000000000000000000000000'

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useParams: jest.fn(() => ({ safe: SAFE })),
}))

describe('Open Safe App page', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    window.localStorage.clear()

    const polygon = chainBuilder().with({ chainId: '137', shortName: 'matic', chainName: 'Polygon' }).build()
    jest
      .spyOn(chainHooks, 'default')
      .mockImplementation(() => ({ configs: [polygon], error: undefined, loading: false }))
    jest.spyOn(chainHooks, 'useChain').mockImplementation(() => polygon)
    jest.spyOn(chainHooks, 'useCurrentChain').mockImplementation(() => polygon)
    jest.spyOn(chainHooks, 'useHasFeature').mockImplementation(() => true)

    jest
      .spyOn(manifest, 'fetchSafeAppFromManifest')
      .mockResolvedValue({ ...transactionBuilderSafeApp, safeAppsPermissions: [] })
  })

  it('shows the disclaimer when no consent is stored', async () => {
    render(<OpenSafeAppPage />, {
      routerProps: { pathname: '/apps/open', query: { safe: SAFE, appUrl: transactionBuilderSafeApp.url } },
    })

    expect(await screen.findByRole('heading', { name: 'Disclaimer' })).toBeInTheDocument()
  })
})
