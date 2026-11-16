import { http, HttpResponse } from 'msw'
import chainsAll from '../../../config/test/msw/fixtures/chains/all.json'

/**
 * Fallback for stories that render chain data without mocking the chain config (e.g. the chain
 * indicator in TokenIcon); they would otherwise call the live gateway. A story's own handlers win.
 */
export const mockChainHandlers = [http.get(/\/v2\/chains$/, () => HttpResponse.json(chainsAll))]
