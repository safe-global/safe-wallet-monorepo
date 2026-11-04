import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { Interface, dataSlice, getAddress } from 'ethers'
import { multiSend, short } from './scenarios/chain.mjs'
import { creationCode } from './scenarios/dashboard.mjs'
import { LEDGER_TEST_MNEMONIC, ledgerOwner } from './scenarios/ledger.mjs'
import { poll } from './scenarios/indexing.mjs'
import { approvedHashSignatures } from './scenarios/staging.mjs'

const safe = '0x1111111111111111111111111111111111111111'
const other = '0x2222222222222222222222222222222222222222'

test('shortens addresses as the wallet shows them', () => {
  assert.equal(short('0x5cB12ca69FD636349521c76c2D50331eDBB29176'), '0x5cB1...9176')
})

test('packs calls for MultiSendCallOnly as one delegate call of the chosen version', () => {
  const call = multiSend([
    { to: other, data: '0x1234' },
    { to: safe, value: 5n },
  ])
  assert.equal(call.operation, 1)
  assert.equal(call.to, '0x9641d764fc13c8B624c04430C7356C1C7C8102e2')
  const [packed] = new Interface(['function multiSend(bytes)']).decodeFunctionData('multiSend', call.data)
  // operation (1 byte), to (20), value (32), data length (32), data
  assert.equal(dataSlice(packed, 1, 21), other)
  assert.equal(BigInt(dataSlice(packed, 53, 85)), 2n)
  assert.equal(dataSlice(packed, 85, 87), '0x1234')
  assert.equal(getAddress(dataSlice(packed, 88, 108)), getAddress(safe))
  assert.equal(BigInt(dataSlice(packed, 108, 140)), 5n)
  assert.equal(multiSend([], { version: '1.3.0' }).to, '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B')
})

test('orders approved-hash signatures by owner address with v = 1', () => {
  const packed = approvedHashSignatures([other, safe])
  assert.equal(packed.length, 2 + 2 * 65 * 2)
  assert.equal(BigInt(dataSlice(packed, 0, 32)), BigInt(safe))
  assert.equal(BigInt(dataSlice(packed, 65, 97)), BigInt(other))
  assert.equal(dataSlice(packed, 64, 65), '0x01')
})

test('wraps runtime code in creation code that returns it unchanged', () => {
  const code = creationCode('0x6001600155')
  assert.equal(code, '0x61000580600c6000396000f36001600155')
})

test('polls until ready and otherwise reports the last answer', async (t) => {
  let status = 503
  const server = createServer((request, response) => response.writeHead(status).end('{}')).listen(0)
  t.after(() => server.close())
  await new Promise((resolve) => server.once('listening', resolve))
  const url = `http://localhost:${server.address().port}/v1/about`
  assert.equal(await poll(url, async (response) => response.ok, Date.now() + 600), 'status 503')
  status = 200
  assert.equal(await poll(url, async (response) => response.ok, Date.now() + 600), undefined)
})

test('derives the Ledger owner from the seed of the emulator in Compose', () => {
  const compose = readFileSync(new URL('./infra/docker-compose.test.yml', import.meta.url), 'utf8')
  assert.equal(/LEDGER_SEED: (.+)/.exec(compose)?.[1], LEDGER_TEST_MNEMONIC)
  assert.equal(ledgerOwner.address, '0x70f4aC46DC07075f1a4D4D3c767e863021449c95')
})
