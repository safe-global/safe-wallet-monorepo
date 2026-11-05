/**
 * Answers the gateway's policy indexer query (POLICY_INDEXER_BASE_URI) with no indexed policy state.
 *
 * Every top-level field of the query comes back as an empty list, under its alias when it has one, so the reply
 * follows the fields the gateway asks for. The proposer policies come through; spending limits and guard policies
 * stay empty.
 */
import { isMain, json, serve } from './http.ts'
import type { MockRequest, Reply } from './http.ts'

const PORT = 8094

/** The response keys of a GraphQL operation: each top-level field, or its alias. */
export function topLevelFields(query: string): string[] {
  const fields: string[] = []
  let braces = 0
  let parens = 0
  let aliased = false
  for (const [token] of query.matchAll(/[A-Za-z_][A-Za-z0-9_]*|[{}():]/g)) {
    if (token === '{') braces++
    else if (token === '}') braces--
    else if (token === '(') parens++
    else if (token === ')') parens--
    else if (braces !== 1 || parens !== 0) continue
    else if (token === ':') aliased = true
    else if (aliased) aliased = false
    else fields.push(token)
  }
  return fields
}

function emptyState(body: string): Reply {
  let query: unknown
  try {
    query = (JSON.parse(body) as { query?: unknown }).query
  } catch {
    return json(400, { errors: [{ message: 'The request body is not JSON' }] })
  }
  const fields = typeof query === 'string' ? topLevelFields(query) : []
  if (fields.length === 0) return json(400, { errors: [{ message: 'The request has no query fields' }] })
  return json(200, { data: Object.fromEntries(fields.map((field) => [field, []])) })
}

export function dispatch({ method, path, body }: Pick<MockRequest, 'method' | 'path' | 'body'>): Reply {
  if (path === '/health') return json(200, { ready: true })
  if (method === 'POST' && path === '/v1/graphql') return emptyState(body)
  return json(404, { errors: [{ message: 'No policy indexer fixture' }] })
}

if (isMain(import.meta.url)) serve(PORT, dispatch)
