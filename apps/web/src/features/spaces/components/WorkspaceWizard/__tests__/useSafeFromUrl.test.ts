import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { chainBuilder } from '@/tests/builders/chains'
import { fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import { safeParamToKey, useSafeFromUrl } from '../hooks/useSafeFromUrl'

const chain = { chainId: faker.string.numeric(5), shortName: faker.string.alpha(6).toLowerCase() }

describe('safeParamToKey', () => {
  const address = fakerChecksummedAddress()

  it('keeps a numeric prefix as the chain ID', () => {
    expect(safeParamToKey(`137:${address}`, [])).toBe(`137:${address}`)
  })

  it('turns a short name prefix into the chain ID of that chain', () => {
    expect(safeParamToKey(`${chain.shortName.toUpperCase()}:${address}`, [chain])).toBe(`${chain.chainId}:${address}`)
  })

  it.each([
    ['a short name no chain has', `unknownchain:${address}`],
    ['an invalid address', `${chain.shortName}:0x1234`],
    ['no prefix', address],
    ['nothing', ''],
  ])('names no Safe for %s', (_, param) => {
    expect(safeParamToKey(param, [chain])).toBeUndefined()
  })
})

describe('useSafeFromUrl', () => {
  it('reads the Safe from the `safe` query parameter', async () => {
    const address = fakerChecksummedAddress()
    server.use(
      http.get(`${GATEWAY_URL}/v2/chains`, () =>
        HttpResponse.json({ results: [chainBuilder().with(chain).build()], next: null }),
      ),
    )

    const { result } = renderHook(() => useSafeFromUrl(), {
      routerProps: { query: { safe: `${chain.shortName}:${address}` } },
    })

    await waitFor(() => expect(result.current).toBe(`${chain.chainId}:${address}`))
  })
})
