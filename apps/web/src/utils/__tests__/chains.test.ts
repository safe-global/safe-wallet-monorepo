import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { FEATURES, getLatestSafeVersion, hasFeature } from '@safe-global/utils/utils/chains'
import { CONFIG_SERVICE_CHAINS } from '@/tests/mocks/chains'
import { chainBuilder } from '@/tests/builders/chains'
import { getChainConfig } from '@/utils/chains'
import { makeStore, setStoreInstance } from '@/store'

describe('chains', () => {
  beforeAll(() => {
    // Initialize store for tests that use getStoreInstance
    const testStore = makeStore({}, { skipBroadcast: true })
    setStoreInstance(testStore)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hasFeature', () => {
    it('returns true for a feature that exists', () => {
      expect(hasFeature(CONFIG_SERVICE_CHAINS[0], FEATURES.ERC721)).toBe(true)
    })

    it("returns false for a feature that doesn't exists", () => {
      expect(
        hasFeature(
          {
            ...CONFIG_SERVICE_CHAINS[0],
            features: [],
          },
          FEATURES.DOMAIN_LOOKUP,
        ),
      ).toBe(false)
    })
  })

  describe('getExplorerLink', () => {
    it('returns the correct link for an address', () => {
      expect(getBlockExplorerLink(CONFIG_SERVICE_CHAINS[0], '0x123')).toEqual({
        href: 'https://etherscan.io/address/0x123',
        title: 'View on etherscan.io',
      })
    })

    it('returns the correct link for a transaction', () => {
      expect(
        getBlockExplorerLink(CONFIG_SERVICE_CHAINS[0], '0x123436456456754735474574575475675435353453465645645656'),
      ).toEqual({
        href: 'https://etherscan.io/tx/0x123436456456754735474574575475675435353453465645645656',
        title: 'View on etherscan.io',
      })
    })
  })

  describe('getChainConfig', () => {
    it('should fetch chain configuration for Ethereum mainnet', async () => {
      const chain = await getChainConfig('1')

      expect(chain).toBeDefined()
      expect(chain.chainId).toBe('1')
      expect(chain.chainName).toBe('Ethereum')
      expect(chain.shortName).toBe('eth')
    })

    it('should fetch chain configuration for Polygon', async () => {
      const chain = await getChainConfig('137')

      expect(chain).toBeDefined()
      expect(chain.chainId).toBe('137')
      expect(chain.chainName).toBe('Polygon')
      expect(chain.shortName).toBe('matic')
    })

    it('should throw an error for unknown chain', async () => {
      // RTK Query unwrap() will reject with the error response from MSW
      // The MSW handler returns 404 for unknown chain IDs
      try {
        await getChainConfig('999999')
        fail('Expected getChainConfig to throw an error')
      } catch (error) {
        // Verify that an error was thrown
        expect(error).toBeDefined()
      }
    })
  })

  describe('chains', () => {
    describe('getLatestSafeVersion', () => {
      it('should return the version from recommendedMasterCopyVersion', () => {
        expect(
          getLatestSafeVersion(chainBuilder().with({ chainId: '1', recommendedMasterCopyVersion: '1.4.1' }).build()),
        ).toEqual('1.4.1')
        expect(
          getLatestSafeVersion(chainBuilder().with({ chainId: '137', recommendedMasterCopyVersion: '1.3.0' }).build()),
        ).toEqual('1.3.0')
      })

      it('should fall back to LATEST_VERSION', () => {
        expect(
          getLatestSafeVersion(
            chainBuilder().with({ chainId: '11155111', recommendedMasterCopyVersion: null }).build(),
          ),
        ).toEqual('1.4.1')
      })
    })
  })
})
