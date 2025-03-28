import { http, HttpResponse } from 'msw'
import type { FiatCurrencies } from '@safe-global/store/src/gateway/types'
import { Balances } from '@safe-global/store/src/gateway/AUTO_GENERATED/balances'
import { CollectiblePage } from '@safe-global/store/src/gateway/AUTO_GENERATED/collectibles'

const iso4217Currencies = ['USD', 'EUR', 'GBP']
export const handlers = (GATEWAY_URL: string) => [
  http.get(`${GATEWAY_URL}/v1/auth/nonce`, () => {
    return HttpResponse.json({
      nonce: 'mock-nonce-for-testing-12345',
      timestamp: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 300000).toISOString(),
    })
  }),

  http.get<never, never, Balances>(`${GATEWAY_URL}/v1/chains/1/safes/0x123/balances/USD`, () => {
    return HttpResponse.json({
      items: [
        {
          tokenInfo: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
            address: '0x',
            type: 'ERC20',
            logoUri: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
          },
          balance: '1000000000000000000',
          fiatBalance: '2000',
          fiatConversion: '2000',
        },
      ],
      fiatTotal: '2000',
    })
  }),
  http.get<never, never, CollectiblePage>(`${GATEWAY_URL}/v2/chains/:chainId/safes/:safeAddress/collectibles`, () => {
    return HttpResponse.json({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: '1',
          address: '0x123',
          tokenName: 'Cool NFT',
          tokenSymbol: 'CNFT',
          logoUri: 'https://example.com/nft1.png',
          name: 'NFT #1',
          description: 'A cool NFT',
          uri: 'https://example.com/nft1.json',
          imageUri: 'https://example.com/nft1.png',
        },
        {
          id: '2',
          address: '0x456',
          tokenName: 'Another NFT',
          tokenSymbol: 'ANFT',
          logoUri: 'https://example.com/nft2.png',
          name: 'NFT #2',
          description: 'Another cool NFT',
          uri: 'https://example.com/nft2.json',
          imageUri: 'https://example.com/nft2.png',
        },
      ],
    })
  }),
  http.get<never, never, FiatCurrencies>(`${GATEWAY_URL}/v1/balances/supported-fiat-codes`, () => {
    return HttpResponse.json(iso4217Currencies)
  }),
]
