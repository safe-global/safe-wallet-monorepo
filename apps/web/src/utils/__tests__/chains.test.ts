import { getBlockExplorerLink } from '@/utils/chains'
import { FEATURES, getLatestSafeVersion, hasFeature } from '@safe-global/utils/utils/chains'
import { CONFIG_SERVICE_CHAINS } from '@/tests/mocks/chains'
import { chainBuilder } from '@/tests/builders/chains'

describe('chains', () => {
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

  describe('chains', () => {
    describe('getLatestSafeVersion', () => {
      it('should return the version from recommendedMasterCopyVersion', () => {
        expect(
          getLatestSafeVersion(
            chainBuilder().with({ chainId: '1', recommendedMasterCopyVersion: '1.4.1' }).build(),
            true,
          ),
        ).toEqual('1.4.1')
        expect(
          getLatestSafeVersion(
            chainBuilder().with({ chainId: '137', recommendedMasterCopyVersion: '1.3.0' }).build(),
            true,
          ),
        ).toEqual('1.3.0')
      })

      it('should always return LATEST_VERSION if true is not passed', () => {
        expect(
          getLatestSafeVersion(chainBuilder().with({ chainId: '1', recommendedMasterCopyVersion: '1.4.1' }).build()),
        ).toEqual('1.4.1')
        expect(
          getLatestSafeVersion(chainBuilder().with({ chainId: '137', recommendedMasterCopyVersion: '1.3.0' }).build()),
        ).toEqual('1.4.1')
      })

      it('should fall back to LATEST_VERSION', () => {
        expect(
          getLatestSafeVersion(
            chainBuilder().with({ chainId: '11155111', recommendedMasterCopyVersion: null }).build(),
            true,
          ),
        ).toEqual('1.4.1')
      })
    })
  })
})
