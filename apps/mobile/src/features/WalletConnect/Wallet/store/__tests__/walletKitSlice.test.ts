import reducer, {
  setSessions,
  addSession,
  removeSession,
  setPending,
  pushPending,
  removePending,
  setOutstandingRequest,
  clearOutstandingRequest,
  clearWalletKitState,
  selectSessions,
  selectSessionCount,
  selectCurrentRequest,
  selectOutstandingRequestByHash,
  selectVerifyByTopic,
  selectDappMetadataByTxHash,
  walletKitSliceName,
  type PendingItem,
} from '../walletKitSlice'
import type { SessionTypes } from '@walletconnect/types'

const session = (topic: string): SessionTypes.Struct => ({ topic }) as unknown as SessionTypes.Struct

const proposalItem = (id: number): PendingItem => ({ kind: 'proposal', id, proposal: { id } as never })
const requestItem = (id: number): PendingItem => ({
  kind: 'request',
  id,
  topic: `topic-${id}`,
  chainId: 'eip155:1',
  method: 'eth_sendTransaction',
  params: {},
})

const wrap = (state: ReturnType<typeof reducer>) => ({ [walletKitSliceName]: state }) as never

describe('walletKitSlice reducers', () => {
  it('setSessions / addSession / removeSession mutate the sessions record', () => {
    let state = reducer(undefined, setSessions({ a: session('a') }))
    expect(Object.keys(state.sessions)).toEqual(['a'])

    state = reducer(state, addSession({ session: session('b'), verifyVariant: 'verified' }))
    expect(Object.keys(state.sessions)).toEqual(['a', 'b'])

    state = reducer(state, removeSession('a'))
    expect(Object.keys(state.sessions)).toEqual(['b'])
  })

  it('pushPending appends and de-dupes by id+kind', () => {
    let state = reducer(undefined, pushPending(requestItem(1)))
    state = reducer(state, pushPending(requestItem(1))) // duplicate
    state = reducer(state, pushPending(proposalItem(1))) // same id, different kind → kept
    expect(state.pending).toHaveLength(2)
  })

  it('removePending removes only the matching id+kind', () => {
    let state = reducer(undefined, setPending([requestItem(1), proposalItem(1)]))
    state = reducer(state, removePending({ id: 1, kind: 'request' }))
    expect(state.pending).toEqual([proposalItem(1)])
  })

  it('setOutstandingRequest / clearOutstandingRequest key by safeTxHash', () => {
    let state = reducer(
      undefined,
      setOutstandingRequest({ safeTxHash: '0xhash', topic: 't', id: 7, method: 'wallet_sendCalls' }),
    )
    expect(state.outstandingRequests['0xhash']).toEqual({ topic: 't', id: 7, method: 'wallet_sendCalls' })
    state = reducer(state, clearOutstandingRequest('0xhash'))
    expect(state.outstandingRequests).toEqual({})
  })

  it('clearWalletKitState resets to initial', () => {
    let state = reducer(undefined, addSession({ session: session('a'), verifyVariant: 'verified' }))
    state = reducer(state, clearWalletKitState())
    expect(state.sessions).toEqual({})
    expect(state.pending).toEqual([])
  })

  it('addSession records the verify variant; removeSession clears it', () => {
    let state = reducer(undefined, addSession({ session: session('a'), verifyVariant: 'verified' }))
    expect(state.verifyByTopic).toEqual({ a: 'verified' })

    state = reducer(state, removeSession('a'))
    expect(state.verifyByTopic).toEqual({})
  })

  it('setSessions prunes verifyByTopic to the incoming topics but keeps active ones', () => {
    let state = reducer(undefined, addSession({ session: session('a'), verifyVariant: 'verified' }))
    state = reducer(state, addSession({ session: session('b'), verifyVariant: 'malicious' }))

    // Rehydrate: only 'a' is still active -> 'b' is pruned, 'a' is kept.
    state = reducer(state, setSessions({ a: session('a') }))
    expect(state.verifyByTopic).toEqual({ a: 'verified' })
  })

  it('setSessions with no active sessions prunes verifyByTopic entirely', () => {
    let state = reducer(undefined, addSession({ session: session('a'), verifyVariant: 'verified' }))
    // Rehydrate path where getActiveSessions() returns nothing must not leave a growing map.
    state = reducer(state, setSessions({}))
    expect(state.verifyByTopic).toEqual({})
  })

  it('setSessions never adds verifyByTopic entries for restored sessions', () => {
    const state = reducer(undefined, setSessions({ a: session('a'), b: session('b') }))
    expect(state.verifyByTopic).toEqual({})
  })

  it('selectVerifyByTopic returns the map', () => {
    const state = reducer(undefined, addSession({ session: session('a'), verifyVariant: 'verified' }))
    expect(selectVerifyByTopic({ [walletKitSliceName]: state } as never)).toEqual({ a: 'verified' })
  })

  it('clear resets verifyByTopic', () => {
    let state = reducer(undefined, addSession({ session: session('a'), verifyVariant: 'verified' }))
    state = reducer(state, clearWalletKitState())
    expect(state.verifyByTopic).toEqual({})
  })
})

describe('walletKitSlice selectors', () => {
  it('selectSessions / selectSessionCount derive from the record', () => {
    const state = reducer(undefined, setSessions({ a: session('a'), b: session('b') }))
    expect(selectSessionCount(wrap(state))).toBe(2)
    expect(selectSessions(wrap(state))).toHaveLength(2)
  })

  it('selectCurrentRequest returns the FIFO head, null when empty', () => {
    expect(selectCurrentRequest(wrap(reducer(undefined, { type: '@@init' })))).toBeNull()
    const state = reducer(undefined, setPending([requestItem(1), requestItem(2)]))
    expect(selectCurrentRequest(wrap(state))).toEqual(requestItem(1))
  })

  it('selectOutstandingRequestByHash looks up by hash', () => {
    const state = reducer(
      undefined,
      setOutstandingRequest({ safeTxHash: '0xabc', topic: 't', id: 1, method: 'eth_sendTransaction' }),
    )
    expect(selectOutstandingRequestByHash(wrap(state), '0xabc')).toEqual({
      topic: 't',
      id: 1,
      method: 'eth_sendTransaction',
    })
  })

  it('selectDappMetadataByTxHash resolves safeTxHash → session peer metadata', () => {
    const metadata = { name: 'Uniswap', url: 'https://uniswap.org', icons: ['https://x/i.png'] }
    let state = reducer(undefined, addSession({ topic: 't', peer: { metadata } } as unknown as SessionTypes.Struct))
    state = reducer(
      state,
      setOutstandingRequest({ safeTxHash: '0xabc', topic: 't', id: 1, method: 'eth_sendTransaction' }),
    )
    expect(selectDappMetadataByTxHash(wrap(state), '0xabc')).toEqual(metadata)
  })

  it('selectDappMetadataByTxHash returns undefined for an unknown hash (non-WC tx)', () => {
    const state = reducer(undefined, { type: '@@init' })
    expect(selectDappMetadataByTxHash(wrap(state), '0xnope')).toBeUndefined()
  })
})
