import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { useGetPolicyTokenInfosQuery } from '..'
import { TOKENS_PER_REQUEST, tokenRefKey, type TokenMetadata } from '../policyTokenInfos'

const tokenAt = (index: number): string => `0x${index.toString(16).padStart(40, '0')}`

const metadataFor = (address: string): TokenMetadata => ({
  type: 'ERC20',
  address,
  symbol: `T${address.slice(-2)}`,
  decimals: 18,
  logoUri: '',
  name: `Token ${address.slice(-2)}`,
  trusted: true,
})

describe('getPolicyTokenInfos', () => {
  it('should, when tokens sit on two chains, ask each chain once and key the answers by chain and address', async () => {
    const requests: { chainId: string; addresses: string }[] = []
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/tokens`, ({ params, request }) => {
        const addresses = new URL(request.url).searchParams.get('addresses') ?? ''
        requests.push({ chainId: String(params.chainId), addresses })
        return HttpResponse.json(addresses.split(',').map(metadataFor))
      }),
    )

    const { result } = renderHook(() =>
      useGetPolicyTokenInfosQuery({
        tokens: [
          { chainId: '1', address: tokenAt(1) },
          { chainId: '1', address: tokenAt(1).toUpperCase().replace('0X', '0x') },
          { chainId: '137', address: tokenAt(2) },
        ],
      }),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(requests).toEqual([
      { chainId: '1', addresses: tokenAt(1) },
      { chainId: '137', addresses: tokenAt(2) },
    ])
    expect(result.current.data?.[tokenRefKey('1', tokenAt(1))]?.symbol).toBe('T01')
    expect(result.current.data?.[tokenRefKey('137', tokenAt(2))]?.symbol).toBe('T02')
  })

  it('should, when a chain has more tokens than one request allows, split them into pages', async () => {
    const pageSizes: number[] = []
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/tokens`, ({ request }) => {
        const addresses = (new URL(request.url).searchParams.get('addresses') ?? '').split(',')
        pageSizes.push(addresses.length)
        return HttpResponse.json(addresses.map(metadataFor))
      }),
    )
    const tokens = Array.from({ length: TOKENS_PER_REQUEST + 1 }, (_, index) => ({
      chainId: '1',
      address: tokenAt(index),
    }))

    const { result } = renderHook(() => useGetPolicyTokenInfosQuery({ tokens }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(pageSizes.sort()).toEqual([1, TOKENS_PER_REQUEST].sort())
    expect(Object.keys(result.current.data ?? {})).toHaveLength(TOKENS_PER_REQUEST + 1)
  })

  it('should, when one chain fails, still return the tokens of the others', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/tokens`, ({ params, request }) => {
        if (params.chainId === '137') return HttpResponse.error()

        const addresses = (new URL(request.url).searchParams.get('addresses') ?? '').split(',')
        return HttpResponse.json(addresses.map(metadataFor))
      }),
    )

    const { result } = renderHook(() =>
      useGetPolicyTokenInfosQuery({
        tokens: [
          { chainId: '1', address: tokenAt(1) },
          { chainId: '137', address: tokenAt(2) },
        ],
      }),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ [tokenRefKey('1', tokenAt(1))]: metadataFor(tokenAt(1)) })
  })
})
