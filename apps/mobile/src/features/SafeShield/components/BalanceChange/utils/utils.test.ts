import { isNftDiff, isNativeAsset, getAssetTypeLabel } from './utils'
import type {
  NativeAssetDetailsDto,
  TokenAssetDetailsDto,
  FungibleDiffDto,
  NftDiffDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'

describe('BalanceChange utils', () => {
  describe('isNftDiff', () => {
    it('returns true for NFT diff with token_id', () => {
      const nftDiff: NftDiffDto = { token_id: 123 }
      expect(isNftDiff(nftDiff)).toBe(true)
    })

    it('returns false for fungible diff with value', () => {
      const fungibleDiff: FungibleDiffDto = { value: '1000000000000000000' }
      expect(isNftDiff(fungibleDiff)).toBe(false)
    })

    it('returns false for empty fungible diff', () => {
      const fungibleDiff: FungibleDiffDto = {}
      expect(isNftDiff(fungibleDiff)).toBe(false)
    })
  })

  describe('isNativeAsset', () => {
    it('returns true for native asset', () => {
      const nativeAsset: NativeAssetDetailsDto = {
        type: 'NATIVE',
        symbol: 'ETH',
      }
      expect(isNativeAsset(nativeAsset)).toBe(true)
    })

    it('returns false for ERC20 token', () => {
      const erc20Asset: TokenAssetDetailsDto = {
        type: 'ERC20',
        symbol: 'USDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      }
      expect(isNativeAsset(erc20Asset)).toBe(false)
    })

    it('returns false for ERC721 token', () => {
      const nftAsset: TokenAssetDetailsDto = {
        type: 'ERC721',
        symbol: 'BAYC',
        address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      }
      expect(isNativeAsset(nftAsset)).toBe(false)
    })

    it('returns false for ERC1155 token', () => {
      const nftAsset: TokenAssetDetailsDto = {
        type: 'ERC1155',
        symbol: 'ITEM',
        address: '0x1234567890123456789012345678901234567890',
      }
      expect(isNativeAsset(nftAsset)).toBe(false)
    })
  })

  describe('getAssetTypeLabel', () => {
    it('returns "Native" for native asset', () => {
      const nativeAsset: NativeAssetDetailsDto = {
        type: 'NATIVE',
        symbol: 'ETH',
      }
      expect(getAssetTypeLabel(nativeAsset)).toBe('Native')
    })

    it('returns "ERC20" for ERC20 token', () => {
      const erc20Asset: TokenAssetDetailsDto = {
        type: 'ERC20',
        symbol: 'USDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      }
      expect(getAssetTypeLabel(erc20Asset)).toBe('ERC20')
    })

    it('returns "NFT" for ERC721 token', () => {
      const nftAsset: TokenAssetDetailsDto = {
        type: 'ERC721',
        symbol: 'BAYC',
        address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      }
      expect(getAssetTypeLabel(nftAsset)).toBe('NFT')
    })

    it('returns "NFT" for ERC1155 token', () => {
      const nftAsset: TokenAssetDetailsDto = {
        type: 'ERC1155',
        symbol: 'ITEM',
        address: '0x1234567890123456789012345678901234567890',
      }
      expect(getAssetTypeLabel(nftAsset)).toBe('NFT')
    })
  })
})
