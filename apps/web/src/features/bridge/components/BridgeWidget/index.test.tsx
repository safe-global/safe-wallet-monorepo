import { faker } from '@faker-js/faker'

import { _getAppData } from '@/features/bridge/components/BridgeWidget'
import { chainBuilder } from '@/tests/builders/chains'

import { FEATURES } from '@safe-global/utils/utils/chains'

describe('BridgeWidget', () => {
  describe('getAppData', () => {
    it('should return the correct SafeAppDataWithPermissions', () => {
      const result = _getAppData(false)

      expect(result).toStrictEqual({
        accessControl: {
          type: 'NO_RESTRICTIONS',
        },
        chainIds: [],
        description: '',
        developerWebsite: '',
        features: [],
        iconUrl: '/images/common/bridge.svg',
        id: expect.any(Number),
        name: 'Bridge',
        safeAppsPermissions: [],
        socialProfiles: [],
        tags: [],
        url: 'https://iframe.jumper.exchange/?theme=light',
      })
    })

    it('should return the correct SafeAppDataWithPermissions with dark mode', () => {
      const result = _getAppData(true)

      expect(result).toStrictEqual({
        accessControl: {
          type: 'NO_RESTRICTIONS',
        },
        chainIds: [],
        description: '',
        developerWebsite: '',
        features: [],
        iconUrl: '/images/common/bridge.svg',
        id: expect.any(Number),
        name: 'Bridge',
        safeAppsPermissions: [],
        socialProfiles: [],
        tags: [],
        url: 'https://iframe.jumper.exchange/?theme=dark',
      })
    })

    it('should return the correct SafeAppDataWithPermissions with chains', () => {
      const chains = Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, (_, i) => {
        return (
          chainBuilder()
            // @ts-expect-error
            .with({ features: i % 2 ? [FEATURES.BRIDGE] : [] })
            .build()
        )
      })

      const result = _getAppData(false, chains)

      expect(result).toStrictEqual({
        accessControl: {
          type: 'NO_RESTRICTIONS',
        },
        // @ts-expect-error
        chainIds: chains.filter((chain) => chain.features.includes(FEATURES.BRIDGE)).map((chain) => chain.chainId),
        description: '',
        developerWebsite: '',
        features: [],
        iconUrl: '/images/common/bridge.svg',
        id: expect.any(Number),
        name: 'Bridge',
        safeAppsPermissions: [],
        socialProfiles: [],
        tags: [],
        url: 'https://iframe.jumper.exchange/?theme=light',
      })
    })
  })
})
