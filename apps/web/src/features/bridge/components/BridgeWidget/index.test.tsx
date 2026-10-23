import { FEATURES } from '@safe-global/utils/utils/chains'
import { render, screen } from '@/tests/test-utils'
import { mockCurrentChain } from '@/tests/mocks/hooks'
import { BridgeWidget, _getAppData } from './'
import { chainBuilder } from '@/tests/builders/chains'

jest.mock('@/hooks/useChains', () => ({ __esModule: true, useCurrentChain: jest.fn() }))
jest.mock('@/components/safe-apps/AppFrame', () => ({
  __esModule: true,
  default: ({ appUrl }: { appUrl: string }) => <iframe title="Bridge" src={appUrl} />,
}))

describe('BridgeWidget', () => {
  it('embeds the bridge app on a chain with the bridge feature', () => {
    const chain = mockCurrentChain({ features: [FEATURES.BRIDGE] })

    render(<BridgeWidget />)

    expect(screen.getByTitle('Bridge')).toHaveAttribute('src', expect.stringContaining(`fromChain=${chain.chainId}`))
  })

  it('embeds nothing on a chain without the bridge feature', () => {
    mockCurrentChain({ features: [] })

    render(<BridgeWidget />)

    expect(screen.queryByTitle('Bridge')).not.toBeInTheDocument()
  })

  describe('getAppData', () => {
    it('should return the correct SafeAppDataWithPermissions', () => {
      const chain = chainBuilder().build()
      const result = _getAppData(false, chain)

      expect(result).toStrictEqual({
        accessControl: {
          type: 'NO_RESTRICTIONS',
        },
        chainIds: [chain.chainId],
        description: '',
        developerWebsite: '',
        featured: false,
        features: [],
        iconUrl: '/images/common/safe-bridge.svg',
        id: expect.any(Number),
        name: 'Bridge',
        safeAppsPermissions: [],
        socialProfiles: [],
        tags: [],
        url: `https://iframe.jumper.exchange/bridge?fromChain=${chain.chainId}&theme=light`,
      })
    })

    it('should return the correct SafeAppDataWithPermissions with dark mode', () => {
      const chain = chainBuilder().build()
      const result = _getAppData(true, chain)

      expect(result).toStrictEqual({
        accessControl: {
          type: 'NO_RESTRICTIONS',
        },
        chainIds: [chain.chainId],
        description: '',
        developerWebsite: '',
        featured: false,
        features: [],
        iconUrl: '/images/common/safe-bridge-dark.svg',
        id: expect.any(Number),
        name: 'Bridge',
        safeAppsPermissions: [],
        socialProfiles: [],
        tags: [],
        url: `https://iframe.jumper.exchange/bridge?fromChain=${chain.chainId}&theme=dark`,
      })
    })
  })
})
