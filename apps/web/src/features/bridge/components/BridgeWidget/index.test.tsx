import { _getAppData } from '@/features/bridge/components/BridgeWidget'
import { chainBuilder } from '@/tests/builders/chains'

describe('BridgeWidget', () => {
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
