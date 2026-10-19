import { createServer as createHttpServer, request as httpRequest } from 'node:http'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { createServer as createHttpsServer, request as httpsRequest } from 'node:https'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export type HeaderMap = Record<string, string>

export type Reply = {
  status: number
  headers: HeaderMap
  body: string
}

export type MockRequest = {
  method: string
  path: string
  query: URLSearchParams
  headers: HeaderMap
  body: string
}

export type Handler = (request: MockRequest) => Reply | Promise<Reply>

export const MAX_BODY_BYTES = 4 * 1024 * 1024
export const KEYS_DIR = '/keys'
const LOCAL_REQUEST_TIMEOUT_MS = 5000
const LISTEN_HOST = '0.0.0.0'

class RequestTooLarge extends Error {}

/** A call that got no HTTP answer at all. The message names only the error type, never the URL. */
export class UpstreamUnreachable extends Error {}

export function json(status: number, payload: unknown): Reply {
  return { status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
}

export function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Set ${name}`)
  return value
}

/** Reads a stream to its end; throws RequestTooLarge after `limitBytes`. */
export async function readText(stream: AsyncIterable<Buffer>, limitBytes = Infinity): Promise<string> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of stream) {
    size += chunk.length
    if (size > limitBytes) throw new RequestTooLarge(`Request body exceeds ${limitBytes} bytes`)
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString()
}

function lowerCaseHeaders(message: IncomingMessage): HeaderMap {
  const headers: HeaderMap = {}
  for (const [name, value] of Object.entries(message.headers)) {
    if (typeof value === 'string') headers[name] = value
  }
  return headers
}

async function replyTo(handle: Handler, message: IncomingMessage): Promise<Reply> {
  try {
    const url = new URL(message.url ?? '/', 'http://mock')
    const body = await readText(message, MAX_BODY_BYTES)
    const headers = lowerCaseHeaders(message)
    return await handle({ method: message.method ?? 'GET', path: url.pathname, query: url.searchParams, headers, body })
  } catch (error) {
    if (error instanceof RequestTooLarge) return json(413, { message: error.message })
    console.error('%s %s failed:', message.method, message.url, error)
    return json(500, { message: String(error) })
  }
}

function listener(handle: Handler): (message: IncomingMessage, response: ServerResponse) => void {
  return (message, response) => {
    void replyTo(handle, message).then((reply) => {
      response.writeHead(reply.status, { ...reply.headers, 'Content-Length': Buffer.byteLength(reply.body) })
      response.end(reply.body)
    })
  }
}

export function serve(port: number, handle: Handler): Server {
  return createHttpServer(listener(handle)).listen(port, LISTEN_HOST)
}

/** Serves over HTTPS with the shared mock certificate. */
export function serveTls(port: number, handle: Handler): Server {
  const options = {
    minVersion: 'TLSv1.2' as const,
    cert: readFileSync(`${KEYS_DIR}/tls-cert.pem`),
    key: readFileSync(`${KEYS_DIR}/tls-key.pem`),
  }
  return createHttpsServer(options, listener(handle)).listen(port, LISTEN_HOST)
}

/** Posts JSON and returns the parsed answer; throws on an HTTP error status, or UpstreamUnreachable. */
export async function postJson(
  url: string,
  payload: unknown,
  timeoutMs: number,
  headers: HeaderMap = {},
): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    throw new UpstreamUnreachable(`No answer: ${(error as Error).name}`, { cause: error })
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

type LocalRequestOptions = { servername?: string }

/**
 * Calls a mock in this container. A `servername` makes the call HTTPS and checks the certificate against
 * the shared mock certificate for that name.
 */
export function localRequest(
  port: number,
  path: string,
  { servername }: LocalRequestOptions = {},
): Promise<{ status: number; body: string }> {
  const options = { host: '127.0.0.1', port, path }
  return new Promise((resolve, reject) => {
    const onResponse = (response: IncomingMessage): void => {
      readText(response).then((text) => resolve({ status: response.statusCode ?? 0, body: text }), reject)
    }
    const request = servername
      ? httpsRequest({ ...options, servername, ca: readFileSync(`${KEYS_DIR}/tls-cert.pem`) }, onResponse)
      : httpRequest(options, onResponse)
    request.setTimeout(LOCAL_REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error(`No answer from port ${port} within ${LOCAL_REQUEST_TIMEOUT_MS} ms`))
    })
    request.on('error', reject)
    request.end()
  })
}

export function isMain(moduleUrl: string): boolean {
  return process.argv[1] !== undefined && moduleUrl === pathToFileURL(process.argv[1]).href
}
