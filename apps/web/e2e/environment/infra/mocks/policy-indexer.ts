/**
 * Answers the gateway's policy indexer query (POLICY_INDEXER_BASE_URI) with no indexed policy state.
 *
 * The gateway reads spending limits from the indexer and proposers from the delegates, in one request. Without an
 * indexer, that request fails, and with it every policy of a Workspace. The empty state lets the proposer policies
 * come through; spending limits stay empty.
 */
import { isMain, json, serve } from './http.ts'
import type { MockRequest, Reply } from './http.ts'

const PORT = 8094

export const EMPTY_STATE = { _meta: [], SafeAllowance: [], SafeDelegate: [] }

export function dispatch({ method, path }: Pick<MockRequest, 'method' | 'path'>): Reply {
  if (path === '/health') return json(200, { ready: true })
  if (method === 'POST' && path === '/v1/graphql') return json(200, { data: EMPTY_STATE })
  return json(404, { errors: [{ message: 'No policy indexer fixture' }] })
}

if (isMain(import.meta.url)) serve(PORT, dispatch)
