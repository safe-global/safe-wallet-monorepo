import * as safeAppsGatewaySDK from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import { render, screen, waitFor } from '@/tests/test-utils'
import SafeAppsDashboardSection from '@/components/dashboard/SafeAppsDashboardSection/SafeAppsDashboardSection'
import { LS_NAMESPACE } from '@/config/constants'

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  ...jest.requireActual('@safe-global/safe-gateway-typescript-sdk'),
  getSafeApps: (): Promise<SafeAppData[]> =>
    Promise.resolve([
      {
        id: 13,
        url: 'https://cloudflare-ipfs.com/ipfs/QmX31xCdhFDmJzoVG33Y6kJtJ5Ujw8r5EJJBrsp8Fbjm7k',
        name: 'Compound',
        iconUrl: 'https://cloudflare-ipfs.com/ipfs/QmX31xCdhFDmJzoVG33Y6kJtJ5Ujw8r5EJJBrsp8Fbjm7k/Compound.png',
        description: 'Money markets on the Ethereum blockchain',
        chainIds: ['1', '4'],
        provider: undefined,
        accessControl: {
          type: safeAppsGatewaySDK.SafeAppAccessPolicyTypes.NoRestrictions,
        },
        tags: [],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        featured: true,
      },
      {
        id: 3,
        url: 'https://app.ens.domains',
        name: 'ENS App',
        iconUrl: 'https://app.ens.domains/android-chrome-144x144.png',
        description: 'Decentralised naming for wallets, websites, & more.',
        chainIds: ['1', '4'],
        provider: undefined,
        accessControl: {
          type: safeAppsGatewaySDK.SafeAppAccessPolicyTypes.DomainAllowlist,
          value: ['https://gnosis-safe.io'],
        },
        tags: [],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        featured: true,
      },
      {
        id: 14,
        url: 'https://cloudflare-ipfs.com/ipfs/QmXLxxczMH4MBEYDeeN9zoiHDzVkeBmB5rBjA3UniPEFcA',
        name: 'Synthetix',
        iconUrl: 'https://cloudflare-ipfs.com/ipfs/QmXLxxczMH4MBEYDeeN9zoiHDzVkeBmB5rBjA3UniPEFcA/Synthetix.png',
        description: 'Trade synthetic assets on Ethereum',
        chainIds: ['1', '4'],
        provider: undefined,
        accessControl: {
          type: safeAppsGatewaySDK.SafeAppAccessPolicyTypes.NoRestrictions,
        },
        tags: [],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        featured: false,
      },
      {
        id: 24,
        url: 'https://cloudflare-ipfs.com/ipfs/QmdVaZxDov4bVARScTLErQSRQoxgqtBad8anWuw3YPQHCs',
        name: 'Transaction Builder',
        iconUrl: 'https://cloudflare-ipfs.com/ipfs/QmdVaZxDov4bVARScTLErQSRQoxgqtBad8anWuw3YPQHCs/tx-builder.png',
        description: 'A Safe app to compose custom transactions',
        chainIds: ['1', '4', '56', '100', '137', '246', '73799'],
        provider: undefined,
        accessControl: {
          type: safeAppsGatewaySDK.SafeAppAccessPolicyTypes.DomainAllowlist,
          value: ['https://gnosis-safe.io'],
        },
        tags: [],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        featured: true,
      },
    ]),
}))

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
