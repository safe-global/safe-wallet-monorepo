import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'
import { CHAIN_INFO } from './sdk'

export const SOURCIFY_URL = 'https://sourcify.dev/server/v2/contract/:chainId/:address'
export const SIMULATION_URL = 'https://simulation.test/simulate'

const chainConfig = http.get('*/v1/chains/:chainId', () =>
  HttpResponse.json({ ...CHAIN_INFO, isTestnet: true, features: ['TX_SIMULATION'] }),
)

export const server = setupServer(chainConfig, ...handlers)

export const serveAbi = (abi: unknown[]) => {
  server.use(http.get(SOURCIFY_URL, () => HttpResponse.json({ abi })))
}
