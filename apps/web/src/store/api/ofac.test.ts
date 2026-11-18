import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { AbiCoder, Interface } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { chainBuilder } from '@/tests/builders/chains'
import { fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { CHAINALYSIS_OFAC_CONTRACT } from '@/config/constants'
import { useGetIsSanctionedQuery } from './ofac'

type RpcRequest = { id: number; method: string; params: Array<{ to: string; data: string }> }
type RpcReply = { result: string } | { error: { code: number; message: string } }
type EthCall = { to: string; data: string }

const sanctionsOracle = new Interface(['function isSanctioned(address) view returns (bool)'])

const chainWithRpc = (chainId: string, rpcUrl: string): Chain =>
  chainBuilder()
    .with({ chainId, rpcUri: { authentication: 'NO_AUTHENTICATION', value: rpcUrl } })
    .build()

const serveChains = (chains: Chain[]) => {
  server.use(
    http.get(`${GATEWAY_URL}/v2/chains`, () =>
      HttpResponse.json({ count: chains.length, next: null, previous: null, results: chains }),
    ),
  )
}

const serveRpc = (rpcUrl: string, reply: RpcReply): EthCall[] => {
  const ethCalls: EthCall[] = []
  const answer = ({ id, method, params }: RpcRequest) => {
    if (method === 'eth_call') ethCalls.push({ to: params[0].to, data: params[0].data })
    return { jsonrpc: '2.0', id, ...reply }
  }
  server.use(
    http.post(rpcUrl, async ({ request }) => {
      const body = (await request.json()) as RpcRequest | RpcRequest[]
      return HttpResponse.json(Array.isArray(body) ? body.map(answer) : answer(body))
    }),
  )
  return ethCalls
}

const oracleAnswer = (sanctioned: boolean): RpcReply => ({
  result: AbiCoder.defaultAbiCoder().encode(['bool'], [sanctioned]),
})

describe('useGetIsSanctionedQuery', () => {
  const mainnetRpcUrl = faker.internet.url({ appendSlash: false })
  const polygonRpcUrl = faker.internet.url({ appendSlash: false })
  const mainnet = chainWithRpc('1', mainnetRpcUrl)
  const polygon = chainWithRpc('137', polygonRpcUrl)
  let address: string

  beforeEach(() => {
    address = fakerChecksummedAddress()
  })

  it('reports an address as sanctioned when the Chainalysis oracle on Ethereum says so', async () => {
    serveChains([polygon, mainnet])
    const mainnetCalls = serveRpc(mainnetRpcUrl, oracleAnswer(true))
    const polygonCalls = serveRpc(polygonRpcUrl, oracleAnswer(false))

    const { result } = renderHook(() => useGetIsSanctionedQuery(address))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(true)
    expect(polygonCalls).toHaveLength(0)
    expect(mainnetCalls).toHaveLength(1)
    expect(mainnetCalls[0].to.toLowerCase()).toBe(CHAINALYSIS_OFAC_CONTRACT.toLowerCase())
    expect(mainnetCalls[0].data).toBe(sanctionsOracle.encodeFunctionData('isSanctioned', [address]))
  })

  it('reports an address as not sanctioned when the oracle says no', async () => {
    serveChains([mainnet])
    serveRpc(mainnetRpcUrl, oracleAnswer(false))

    const { result } = renderHook(() => useGetIsSanctionedQuery(address))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(false)
  })

  it('fails without asking any oracle when the chain config has no Ethereum mainnet', async () => {
    serveChains([polygon])
    const polygonCalls = serveRpc(polygonRpcUrl, oracleAnswer(false))

    const { result } = renderHook(() => useGetIsSanctionedQuery(address))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
    expect(polygonCalls).toHaveLength(0)
  })

  it('fails rather than reporting not sanctioned when the oracle call errors', async () => {
    serveChains([mainnet])
    serveRpc(mainnetRpcUrl, { error: { code: -32000, message: faker.lorem.sentence() } })

    const { result } = renderHook(() => useGetIsSanctionedQuery(address))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})
