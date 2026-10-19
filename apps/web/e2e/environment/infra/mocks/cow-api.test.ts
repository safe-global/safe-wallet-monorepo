import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'
import { PREFIX, recordedReply, loadFixtures, registerSettlement, dispatch } from './cow-api.ts'
import type { Upstream } from './cow-api.ts'
import type { Reply } from './http.ts'

const STAGING_OWNER = '03042b890b99552b60a073f808100517fb148f60'
const LOCAL_OWNER = '1234567890abcdef1234567890abcdef12345678'
const DIGEST = '49ebbf8fe2f57ae022dca12284bcf21a3885ed705cea3426513579b1419b932c'
const VALID_TO = '66700727'
const RECORDED_UID = `0x${DIGEST}${LOCAL_OWNER}${VALID_TO}`
const UNRECORDED_UID = `0x${DIGEST}${LOCAL_OWNER}00000000`
const TX_HASH = `0x${'ab'.repeat(32)}`

const fixtures = loadFixtures()
const root = mkdtempSync(join(tmpdir(), 'cow-api-'))
const noSettlements = join(root, 'none')

function newSettlementsDir(): string {
  return mkdtempSync(join(root, 'settlements-'))
}

function get(path: string, settlementsDir = noSettlements): [number, Record<string, unknown>] | undefined {
  const reply = recordedReply(fixtures, settlementsDir, PREFIX + path)
  return reply && [reply.status, JSON.parse(reply.body)]
}

function recordingUpstream(): Upstream & { paths: string[] } {
  const paths: string[] = []
  const upstream = async (path: string): Promise<Reply> => {
    paths.push(path)
    return { status: 200, headers: {}, body: '{}' }
  }
  return Object.assign(upstream, { paths })
}

function request(url: string): { path: string; query: URLSearchParams } {
  const { pathname, searchParams } = new URL(url, 'https://api.cow.fi')
  return { path: pathname, query: searchParams }
}

describe('CoW API mock', () => {
  after(() => rmSync(root, { recursive: true }))

  it('serves a recorded order for the replaying Safe', () => {
    const [status, order] = get(`/orders/${RECORDED_UID}`) ?? []
    assert.equal(status, 200)
    assert.equal(order?.uid, RECORDED_UID)
    assert.equal(order?.owner, `0x${LOCAL_OWNER}`)
    assert.equal(order?.receiver, `0x${LOCAL_OWNER}`)
    assert.equal(order?.status, 'fulfilled')
    assert.doesNotMatch(JSON.stringify(order), new RegExp(STAGING_OWNER))
  })

  it('finds an order with a recomputed digest by its validTo', () => {
    const uid = `0x${'ab'.repeat(32)}${LOCAL_OWNER}${VALID_TO}`
    const [status, order] = get(`/orders/${uid}`) ?? []
    assert.deepEqual([status, order?.uid], [200, uid])
  })

  it('serves recorded app data', () => {
    const [appData] = Object.keys(fixtures.appData)
    const [status, body] = get(`/app_data/${appData}`) ?? []
    assert.equal(status, 200)
    assert.match(String(body?.fullAppData), /appCode/)
  })

  it('leaves unrecorded requests to the real API', () => {
    assert.equal(get(`/orders/${UNRECORDED_UID}`), undefined)
    assert.equal(get(`/app_data/0x${'00'.repeat(32)}`), undefined)
    assert.equal(get(`/transactions/0x${'00'.repeat(32)}/orders`), undefined)
    assert.equal(get('/orders/not-a-uid'), undefined)
    assert.equal(recordedReply(fixtures, noSettlements, '/mainnet/api/v1/orders/x'), undefined)
  })

  it('answers unrecorded requests without the real API in offline mode', async () => {
    const upstream = recordingUpstream()
    const options = { fixtures, settlementsDir: noSettlements, offline: true, upstream }
    const reply = await dispatch(request(`${PREFIX}/orders/${UNRECORDED_UID}`), options)
    assert.deepEqual([reply.status, JSON.parse(reply.body).errorType], [404, 'NotFound'])
    assert.deepEqual(upstream.paths, [])
  })

  it('forwards only unrecorded requests in recording mode', async () => {
    const upstream = recordingUpstream()
    const options = { fixtures, settlementsDir: noSettlements, offline: false, upstream }
    assert.equal((await dispatch(request(`${PREFIX}/orders/${RECORDED_UID}?extra=1`), options)).status, 200)
    assert.deepEqual(upstream.paths, [])
    const unrecorded = `${PREFIX}/orders/${UNRECORDED_UID}?extra=1`
    assert.equal((await dispatch(request(unrecorded), options)).status, 200)
    assert.deepEqual(upstream.paths, [unrecorded])
  })

  it('returns the orders of a registered settlement for the local Safe', () => {
    const settlementsDir = newSettlementsDir()
    registerSettlement(TX_HASH, [RECORDED_UID.toUpperCase().replace('0X', '0x')], settlementsDir)
    const [status, orders] = get(`/transactions/${TX_HASH}/orders`, settlementsDir) ?? []
    assert.equal(get(`/transactions/0x${'cd'.repeat(32)}/orders`, settlementsDir), undefined)
    assert.equal(status, 200)
    const [order] = orders as unknown as { uid: string; owner: string }[]
    assert.deepEqual([order.uid, order.owner], [RECORDED_UID, `0x${LOCAL_OWNER}`])
  })

  it('rejects malformed settlements and fails ones that reference unrecorded orders', () => {
    const settlementsDir = newSettlementsDir()
    assert.throws(() => registerSettlement(TX_HASH, ['not-a-uid'], settlementsDir))
    assert.throws(() => registerSettlement('not-a-hash', [RECORDED_UID], settlementsDir))
    registerSettlement(TX_HASH, [UNRECORDED_UID], settlementsDir)
    assert.throws(() => get(`/transactions/${TX_HASH}/orders`, settlementsDir), /unrecorded order/)
  })
})
