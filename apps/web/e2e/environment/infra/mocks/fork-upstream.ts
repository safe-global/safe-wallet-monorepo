/**
 * Forwards Anvil's fork requests to the archive RPC in FORK_UPSTREAM_URL.
 *
 * Anvil names its fork cache after the hash of its fork URL. Forking from this proxy keeps that URL, and so the
 * committed cache in fork-cache/, the same for every RPC provider and key. The secret URL is never logged.
 */
import { MAX_BODY_BYTES, isMain, json, serve } from './http.ts'
import type { Handler, Reply } from './http.ts'

const PORT = 8546
const TIMEOUT_MS = 60_000
// Infura's mainnet archive answers some concurrent reads with this code, and Anvil does not retry it.
const INTERNAL_ERROR = -32603
export const INTERNAL_ERROR_ATTEMPTS = 4

export type Answer = { status: number; body: string }
export type Post = (upstream: string, payload: string) => Promise<Answer>
type Pause = (ms: number) => Promise<void>

export function hasInternalError(body: string): boolean {
  let answers: unknown
  try {
    answers = JSON.parse(body)
  } catch {
    return false
  }
  return (Array.isArray(answers) ? answers : [answers]).some(
    (answer) => (answer as { error?: { code?: number } } | null)?.error?.code === INTERNAL_ERROR,
  )
}

const postUpstream: Post = async (upstream, payload) => {
  try {
    const response = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    // Anvil retries on 429 and 5xx, so the status passes through unchanged.
    return { status: response.status, body: await response.text() }
  } catch (error) {
    // Only the error name: the message or its cause can contain the secret URL.
    console.error(`Fork upstream request failed: ${(error as Error).name}`)
    return { status: 502, body: '' }
  }
}

const sleep: Pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Returns the upstream answer; retries answers that report a transient internal error. */
export async function forward(
  upstream: string,
  payload: string,
  post: Post = postUpstream,
  pause: Pause = sleep,
): Promise<Answer> {
  for (let attempt = 0; ; attempt++) {
    const answer = await post(upstream, payload)
    const last = attempt === INTERNAL_ERROR_ATTEMPTS - 1
    if (answer.status !== 200 || !hasInternalError(answer.body) || last) return answer
    await pause(500 * 2 ** attempt)
  }
}

export function forkUpstream(upstream: string, post: Post = postUpstream): Handler {
  if (!/^https?:\/\//.test(upstream)) throw new Error('Set FORK_UPSTREAM_URL to the archive RPC of this fork')
  let forwarded = 0
  return async ({ method, path, body }): Promise<Reply> => {
    if (method === 'GET') {
      // How many requests reached the archive RPC; a complete fork cache keeps this low.
      if (path === '/status') return json(200, { forwarded })
      return path === '/health' ? json(200, { ready: true }) : json(404, {})
    }
    if (!body || Buffer.byteLength(body) > MAX_BODY_BYTES) return json(400, {})
    forwarded += 1
    const answer = await forward(upstream, body, post)
    return { status: answer.status, headers: { 'Content-Type': 'application/json' }, body: answer.body }
  }
}

if (isMain(import.meta.url)) serve(PORT, forkUpstream(process.env.FORK_UPSTREAM_URL ?? ''))
