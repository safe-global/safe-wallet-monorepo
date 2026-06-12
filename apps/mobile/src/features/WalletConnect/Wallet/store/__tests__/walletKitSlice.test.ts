import reducer, {
  setSessions,
  addSession,
  removeSession,
  setPending,
  pushPending,
  removePending,
  setOutstandingRequest,
  setOutstandingProposing,
  clearOutstandingRequest,
  clearWalletKitState,
  selectSessions,
  selectSessionCount,
  selectCurrentRequest,
  selectOutstandingRequestByHash,
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

    state = reducer(state, addSession(session('b')))
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

  it('setOutstandingProposing toggles the flag and is a no-op for unknown hashes', () => {
    let state = reducer(
      undefined,
      setOutstandingRequest({
        safeTxHash: '0xhash',
        topic: 't',
        id: 7,
        method: 'wallet_sendCalls',
        chainId: '1',
        safeAddress: '0xsafe',
      }),
    )
    state = reducer(state, setOutstandingProposing({ safeTxHash: '0xhash', proposing: true }))
    expect(state.outstandingRequests['0xhash'].proposing).toBe(true)
    state = reducer(state, setOutstandingProposing({ safeTxHash: '0xhash', proposing: false }))
    expect(state.outstandingRequests['0xhash'].proposing).toBe(false)
    state = reducer(state, setOutstandingProposing({ safeTxHash: '0xnope', proposing: true }))
    expect(state.outstandingRequests['0xnope']).toBeUndefined()
  })

  it('setOutstandingRequest / clearOutstandingRequest key by safeTxHash', () => {
    let state = reducer(
      undefined,
      setOutstandingRequest({
        safeTxHash: '0xhash',
        topic: 't',
        id: 7,
        method: 'wallet_sendCalls',
        chainId: '1',
        safeAddress: '0xsafe',
      }),
    )
    expect(state.outstandingRequests['0xhash']).toEqual({
      topic: 't',
      id: 7,
      method: 'wallet_sendCalls',
      chainId: '1',
      safeAddress: '0xsafe',
    })
    state = reducer(state, clearOutstandingRequest('0xhash'))
    expect(state.outstandingRequests).toEqual({})
  })

  it('clearWalletKitState resets to initial', () => {
    let state = reducer(undefined, addSession(session('a')))
    state = reducer(state, clearWalletKitState())
    expect(state.sessions).toEqual({})
    expect(state.pending).toEqual([])
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
      setOutstandingRequest({
        safeTxHash: '0xabc',
        topic: 't',
        id: 1,
        method: 'eth_sendTransaction',
        chainId: '1',
        safeAddress: '0xsafe',
      }),
    )
    expect(selectOutstandingRequestByHash(wrap(state), '0xabc')).toEqual({
      topic: 't',
      id: 1,
      method: 'eth_sendTransaction',
      chainId: '1',
      safeAddress: '0xsafe',
    })
  })

  it('selectDappMetadataByTxHash resolves safeTxHash → session peer metadata', () => {
    const metadata = { name: 'Uniswap', url: 'https://uniswap.org', icons: ['https://x/i.png'] }
    let state = reducer(undefined, addSession({ topic: 't', peer: { metadata } } as unknown as SessionTypes.Struct))
    state = reducer(
      state,
      setOutstandingRequest({
        safeTxHash: '0xabc',
        topic: 't',
        id: 1,
        method: 'eth_sendTransaction',
        chainId: '1',
        safeAddress: '0xsafe',
      }),
    )
    expect(selectDappMetadataByTxHash(wrap(state), '0xabc')).toEqual(metadata)
  })

  it('selectDappMetadataByTxHash returns undefined for an unknown hash (non-WC tx)', () => {
    const state = reducer(undefined, { type: '@@init' })
    expect(selectDappMetadataByTxHash(wrap(state), '0xnope')).toBeUndefined()
  })
})
