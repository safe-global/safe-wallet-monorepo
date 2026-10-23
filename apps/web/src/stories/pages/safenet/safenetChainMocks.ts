import { http, HttpResponse, type RequestHandler } from 'msw'
import { createMockChain } from '@safe-global/test'
import { createChainData, createChainsPageDataV2 } from '@/stories/mocks/chains'

const RPC_URL = 'https://rpc.safe.global/100/'

/** The `/v2/chains` page with Gnosis Chain added, where Safenet attestations land. */
const safenetChainsPage = () => {
  const chains = createChainsPageDataV2(createChainData())
  const gnosis = createMockChain({ chainId: '100', chainName: 'Gnosis Chain', rpcUri: RPC_URL })
  return { ...chains, results: [...chains.results, gnosis] }
}

export const safenetChainsHandler = (): RequestHandler => {
  const page = safenetChainsPage()
  return http.get(/\/v2\/chains$/, () => HttpResponse.json(page))
}
