/**
 * @jest-environment node
 */
import * as fs from 'fs'
import * as path from 'path'
import {
  imageSource,
  isRemoteImage,
  localImagePath,
  localizeImages,
  trimBalances,
  trimPortfolio,
} from '@safe-global/test/msw/scripts/fetch-fixtures'

const MOCK_ASSETS_DIR = path.join(__dirname, '../../../.storybook/mock-assets')
const WETH_LOGO = 'https://assets.coingecko.com/coins/images/32882/thumb/WETH_%281%29.png?1699716492'
const AAVE_ICON = 'https://protocol-icons.s3.amazonaws.com/icons/aave-v2.jpg'

const response = (status: number) => ({ status, ok: status < 400, statusText: `status ${status}` }) as Response

describe('fetch-fixtures', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('isRemoteImage', () => {
    it.each([WETH_LOGO, 'http://example.org/logo.SVG'])('is true for %s', (value) => {
      expect(isRemoteImage(value)).toBe(true)
    })

    it.each([
      'https://app.aave.com',
      'mock-assets/assets.coingecko.com/coins/images/6319/small/usdc.webp',
      'images/common/token-placeholder.svg',
      'data:image/webp;base64,AAAA',
      '',
    ])('is false for %s', (value) => {
      expect(isRemoteImage(value)).toBe(false)
    })
  })

  describe('localImagePath', () => {
    it('stores the small CoinGecko variant without the query or parentheses', () => {
      expect(localImagePath(imageSource(WETH_LOGO))).toBe('assets.coingecko.com/coins/images/32882/small/WETH_-1.webp')
    })

    it('reuses the committed spelling of a name that differs only in case', () => {
      const url = imageSource('https://assets.coingecko.com/coins/images/6319/thumb/USDC.png?1769615602')

      expect(localImagePath(url)).toBe('assets.coingecko.com/coins/images/6319/small/usdc.webp')
    })

    it('names a new image after its host and path', () => {
      expect(localImagePath(imageSource('https://example.org/logos/Token.JPEG'))).toBe('example.org/logos/Token.webp')
    })
  })

  describe('localizeImages', () => {
    it('points remote images at their committed copies without a download', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch')
      const fixture = {
        items: [{ tokenInfo: { logoUri: WETH_LOGO, name: 'WETH' } }],
        next: 'https://example.org/page2',
      }

      await expect(localizeImages(fixture)).resolves.toEqual({
        items: [
          {
            tokenInfo: {
              logoUri: 'mock-assets/assets.coingecko.com/coins/images/32882/small/WETH_-1.webp',
              name: 'WETH',
            },
          },
        ],
        next: 'https://example.org/page2',
      })
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('inlines a protocol logo as a data URI', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch')

      const result = (await localizeImages({ appInfo: { logoUrl: AAVE_ICON } })) as { appInfo: { logoUrl: string } }

      expect(result.appInfo.logoUrl).toMatch(/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/)
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('uses the placeholder for an image the host does not have, and saves no file', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue(response(404))
      const missing = 'https://example.org/missing/404-logo.png'

      await expect(localizeImages({ logoUri: missing })).resolves.toEqual({
        logoUri: 'images/common/token-placeholder.svg',
      })
      expect(fs.existsSync(path.join(MOCK_ASSETS_DIR, 'example.org/missing'))).toBe(false)
    })

    it('fails on a server error instead of hiding the logo', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue(response(503))

      await expect(localizeImages({ logoUri: 'https://example.org/broken/logo.png' })).rejects.toThrow(
        'HTTP 503 status 503 from https://example.org/broken/logo.png',
      )
    })
  })

  describe('trimBalances', () => {
    it('keeps the listed tokens in their original order and totals what is left', () => {
      const token = (address: string, fiatBalance: string) => ({ tokenInfo: { address }, fiatBalance })
      const balances = { fiatTotal: '111', items: [token('0xA', '100'), token('0xB', '10'), token('0xC', '1')] }

      expect(trimBalances(balances, ['0xC', '0xA'])).toEqual({
        fiatTotal: '101',
        items: [token('0xA', '100'), token('0xC', '1')],
      })
    })
  })

  describe('trimPortfolio', () => {
    it('matches tokens by chain and address and keeps the positions total', () => {
      const token = (chainId: string, balanceFiat: string | null) => ({
        tokenInfo: { chainId, address: '0x0000000000000000000000000000000000000000' },
        balanceFiat,
      })
      const portfolio = {
        totalBalanceFiat: '1500',
        totalTokenBalanceFiat: '1000',
        totalPositionsBalanceFiat: '500',
        tokenBalances: [token('1', '900'), token('10', '60'), token('56', '40'), token('100', null)],
      }

      expect(
        trimPortfolio(portfolio, [
          '1:0x0000000000000000000000000000000000000000',
          '56:0x0000000000000000000000000000000000000000',
          '100:0x0000000000000000000000000000000000000000',
        ]),
      ).toEqual({
        totalBalanceFiat: '1440',
        totalTokenBalanceFiat: '940',
        totalPositionsBalanceFiat: '500',
        tokenBalances: [token('1', '900'), token('56', '40'), token('100', null)],
      })
    })
  })
})
