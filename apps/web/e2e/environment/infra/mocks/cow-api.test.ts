import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PREFIX, recordedReply, loadFixtures, registerSettlement, dispatch } from './cow-api.ts'
import type { Settlements, Upstream } from './cow-api.ts'
import type { Reply } from './http.ts'

const STAGING_OWNER = '03042b890b99552b60a073f808100517fb148f60'
const LOCAL_OWNER = '1234567890abcdef1234567890abcdef12345678'
const DIGEST = '49ebbf8fe2f57ae022dca12284bcf21a3885ed705cea3426513579b1419b932c'
const VALID_TO = '66700727'
const RECORDED_UID = `0x${DIGEST}${LOCAL_OWNER}${VALID_TO}`
const UNRECORDED_UID = `0x${DIGEST}${LOCAL_OWNER}00000000`
const TX_HASH = `0x${'ab'.repeat(32)}`

const fixtures = loadFixtures()

function get(path: string, settlements: Settlements = new Map()): [number, Record<string, unknown>] | undefined {
  const reply = recordedReply(fixtures, settlements, PREFIX + path)
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

function request(
  method: string,
  url: string,
  body = '',
): { method: string; path: string; query: URLSearchParams; body: string } {
  const { pathname, searchParams } = new URL(url, 'https://api.cow.fi')
  return { method, path: pathname, query: searchParams, body }
}

describe('CoW API mock', () => {
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
    assert.equal(recordedReply(fixtures, new Map(), '/mainnet/api/v1/orders/x'), undefined)
  })

  it('answers unrecorded requests without the real API in offline mode', async () => {
    const upstream = recordingUpstream()
    const options = { fixtures, settlements: new Map(), offline: true, upstream }
    const reply = await dispatch(request('GET', `${PREFIX}/orders/${UNRECORDED_UID}`), options)
    assert.deepEqual([reply.status, JSON.parse(reply.body).errorType], [404, 'NotFound'])
    assert.deepEqual(upstream.paths, [])
  })

  it('forwards only unrecorded requests in recording mode', async () => {
    const upstream = recordingUpstream()
    const options = { fixtures, settlements: new Map(), offline: false, upstream }
    assert.equal((await dispatch(request('GET', `${PREFIX}/orders/${RECORDED_UID}?extra=1`), options)).status, 200)
    assert.deepEqual(upstream.paths, [])
    const unrecorded = `${PREFIX}/orders/${UNRECORDED_UID}?extra=1`
    assert.equal((await dispatch(request('GET', unrecorded), options)).status, 200)
    assert.deepEqual(upstream.paths, [unrecorded])
  })

  it('returns the orders of a registered settlement for the local Safe', async () => {
    const settlements: Settlements = new Map()
    const options = { fixtures, settlements, offline: true }
    const body = JSON.stringify({ txHash: TX_HASH, uids: [RECORDED_UID.toUpperCase().replace('0X', '0x')] })
    assert.equal((await dispatch(request('POST', '/__test/settlements', body), options)).status, 200)
    const [status, orders] = get(`/transactions/${TX_HASH}/orders`, settlements) ?? []
    assert.equal(get(`/transactions/0x${'cd'.repeat(32)}/orders`, settlements), undefined)
    assert.equal(status, 200)
    const [order] = orders as unknown as { uid: string; owner: string }[]
    assert.deepEqual([order.uid, order.owner], [RECORDED_UID, `0x${LOCAL_OWNER}`])
  })

  it('rejects malformed settlements and fails ones that reference unrecorded orders', async () => {
    const settlements: Settlements = new Map()
    const options = { fixtures, settlements, offline: true }
    const malformed = [
      JSON.stringify({ txHash: TX_HASH, uids: ['not-a-uid'] }),
      JSON.stringify({ txHash: TX_HASH, uids: RECORDED_UID }),
      JSON.stringify({ uids: [RECORDED_UID] }),
      JSON.stringify([TX_HASH, RECORDED_UID]),
      'not json',
      '',
    ]
    for (const body of malformed) {
      assert.equal((await dispatch(request('POST', '/__test/settlements', body), options)).status, 400, body)
    }
    assert.throws(() => registerSettlement(settlements, 'not-a-hash', [RECORDED_UID]))
    registerSettlement(settlements, TX_HASH, [UNRECORDED_UID])
    assert.throws(() => get(`/transactions/${TX_HASH}/orders`, settlements), /unrecorded order/)
  })
})
