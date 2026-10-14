import { createServer as createHttpServer, request as httpRequest } from 'node:http'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { createServer as createHttpsServer, request as httpsRequest } from 'node:https'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export type Headers = Record<string, string>

export type Reply = {
  status: number
  headers: Headers
  body: string
}

export type Request = {
  method: string
  path: string
  query: URLSearchParams
  headers: Headers
  body: string
}

export type Handler = (request: Request) => Reply | Promise<Reply>

export const MAX_BODY_BYTES = 4 * 1024 * 1024
export const KEYS_DIR = '/keys'

export class RequestTooLarge extends Error {}

export function json(status: number, payload: unknown): Reply {
  return { status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
}

/** Compose sets MOCK_HOST to 0.0.0.0; anywhere else a mock answers only this machine. */
export function listenHost(): string {
  return process.env.MOCK_HOST || '127.0.0.1'
}

export function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Set ${name}`)
  return value
}

async function readBody(message: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of message) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new RequestTooLarge(`Request body exceeds ${MAX_BODY_BYTES} bytes`)
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString()
}

function lowerCaseHeaders(message: IncomingMessage): Headers {
  const headers: Headers = {}
  for (const [name, value] of Object.entries(message.headers)) {
    if (typeof value === 'string') headers[name] = value
  }
  return headers
}

async function answer(handle: Handler, message: IncomingMessage, response: ServerResponse): Promise<void> {
  let reply: Reply
  try {
    const url = new URL(message.url ?? '/', 'http://mock')
    const body = await readBody(message)
    const headers = lowerCaseHeaders(message)
    reply = await handle({
      method: message.method ?? 'GET',
      path: url.pathname,
      query: url.searchParams,
      headers,
      body,
    })
  } catch (error) {
    if (error instanceof RequestTooLarge) {
      reply = json(413, { message: error.message })
    } else {
      console.error('%s %s failed:', message.method, message.url, error)
      reply = json(500, { message: String(error) })
    }
  }
  response.writeHead(reply.status, { ...reply.headers, 'Content-Length': Buffer.byteLength(reply.body) })
  response.end(reply.body)
}

/** Serves `handle` over HTTP, or over HTTPS with the shared mock certificate when `tls` is true. */
export function serve(port: number, handle: Handler, tls = false): Server {
  const listener = (message: IncomingMessage, response: ServerResponse): void => {
    void answer(handle, message, response)
  }
  const server = tls
    ? createHttpsServer(
        {
          minVersion: 'TLSv1.2',
          cert: readFileSync(`${KEYS_DIR}/tls-cert.pem`),
          key: readFileSync(`${KEYS_DIR}/tls-key.pem`),
        },
        listener,
      )
    : createHttpServer(listener)
  return server.listen(port, listenHost())
}

/** Posts JSON and returns the parsed answer; throws on a network failure or an HTTP error status. */
export async function postJson(
  url: string,
  payload: unknown,
  timeoutMs: number,
  headers: Headers = {},
): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

/**
 * Calls a mock in this container. A `servername` makes the call HTTPS and checks the certificate against
 * the shared mock certificate for that name.
 */
export function localRequest(
  port: number,
  path: string,
  { method = 'GET', body = '', servername }: { method?: string; body?: string; servername?: string } = {},
): Promise<{ status: number; body: string }> {
  const options = { host: '127.0.0.1', port, path, method, headers: { 'Content-Type': 'application/json' } }
  return new Promise((resolve, reject) => {
    const onResponse = (response: IncomingMessage): void => {
      const chunks: Buffer[] = []
      response.on('data', (chunk: Buffer) => chunks.push(chunk))
      response.on('end', () => resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString() }))
    }
    const request = servername
      ? httpsRequest({ ...options, servername, ca: readFileSync(`${KEYS_DIR}/tls-cert.pem`) }, onResponse)
      : httpRequest(options, onResponse)
    request.setTimeout(5000, () => request.destroy(new Error(`No answer from port ${port} within 5 s`)))
    request.on('error', reject)
    request.end(body)
  })
}

export function isMain(moduleUrl: string): boolean {
  return process.argv[1] !== undefined && moduleUrl === pathToFileURL(process.argv[1]).href
}
