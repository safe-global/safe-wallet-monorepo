import assert from 'node:assert/strict'
import { once } from 'node:events'
import { connect } from 'node:net'
import type { AddressInfo } from 'node:net'
import { describe, it } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { json, serve } from './http.ts'

// Node's default server closes an idle keep-alive connection 6 s after its last response
const PAST_NODE_IDLE_TIMEOUT_MS = 7_000

describe('mock HTTP server', () => {
  it('keeps an idle keep-alive connection open, so that a client can reuse it', async () => {
    const server = serve(0, () => json(200, {}))
    await once(server, 'listening')
    const socket = connect((server.address() as AddressInfo).port, '127.0.0.1')
    let closedByServer = false
    socket.on('end', () => (closedByServer = true))
    try {
      socket.write('GET / HTTP/1.1\r\nHost: mock\r\nConnection: keep-alive\r\n\r\n')
      await once(socket, 'data')
      await sleep(PAST_NODE_IDLE_TIMEOUT_MS)

      assert.equal(closedByServer, false)
    } finally {
      socket.destroy()
      server.close()
    }
  })
})
