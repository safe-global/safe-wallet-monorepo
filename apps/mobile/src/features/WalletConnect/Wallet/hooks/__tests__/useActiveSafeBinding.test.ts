import { getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { renderHookWithStore, createTestStore, waitFor } from '@/src/tests/test-utils'
import { useActiveSafeBinding } from '../useActiveSafeBinding'
import { walletKitSliceName } from '../../store/walletKitSlice'
import type { SessionTypes } from '@walletconnect/types'
import type { IWalletKit } from '@reown/walletkit'

const safeAddress = getAddress(faker.finance.ethereumAddress()) as `0x${string}`
const checksummed = getAddress(safeAddress)

const makeSession = (topic: string, chains: string[]): SessionTypes.Struct =>
  ({
    topic,
    namespaces: { eip155: { chains, accounts: chains.map((c) => `${c}:${checksummed}`), methods: [], events: [] } },
  }) as unknown as SessionTypes.Struct

const makeWalletKit = (live: Record<string, SessionTypes.Struct>) =>
  ({
    getActiveSessions: jest.fn(() => live),
    updateSession: jest.fn().mockResolvedValue(undefined),
    emitSessionEvent: jest.fn().mockResolvedValue(undefined),
  }) as unknown as IWalletKit & {
    updateSession: jest.Mock
    emitSessionEvent: jest.Mock
    getActiveSessions: jest.Mock
  }

describe('useActiveSafeBinding', () => {
  it('does nothing without a walletKit', () => {
    const store = createTestStore({ activeSafe: { address: safeAddress, chainId: '1' } })
    renderHookWithStore(() => useActiveSafeBinding(null), store)
    // No throw, no calls — nothing to assert beyond a clean render.
  })

  it('updates each live session and emits accountsChanged + chainChanged on safe change', async () => {
    const session = makeSession('topic-1', ['eip155:1', 'eip155:137'])
    const wk = makeWalletKit({ 'topic-1': session })
    const store = createTestStore({
      activeSafe: { address: safeAddress, chainId: '1' },
      [walletKitSliceName]: { sessions: { 'topic-1': session }, pending: [], outstandingRequests: {} },
    } as never)

    renderHookWithStore(() => useActiveSafeBinding(wk), store)

    await waitFor(() => expect(wk.updateSession).toHaveBeenCalledTimes(1))
    expect(wk.updateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'topic-1',
        namespaces: expect.objectContaining({
          eip155: expect.objectContaining({ accounts: [`eip155:1:${checksummed}`, `eip155:137:${checksummed}`] }),
        }),
      }),
    )
    expect(wk.emitSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: { name: 'accountsChanged', data: [checksummed] }, chainId: 'eip155:1' }),
    )
    expect(wk.emitSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: { name: 'chainChanged', data: 1 }, chainId: 'eip155:1' }),
    )
  })

  it('skips sessions absent from the live SDK snapshot', async () => {
    const session = makeSession('topic-1', ['eip155:1'])
    const wk = makeWalletKit({}) // live snapshot is empty
    const store = createTestStore({
      activeSafe: { address: safeAddress, chainId: '1' },
      [walletKitSliceName]: { sessions: { 'topic-1': session }, pending: [], outstandingRequests: {} },
    } as never)

    renderHookWithStore(() => useActiveSafeBinding(wk), store)

    await waitFor(() => expect(wk.getActiveSessions).toHaveBeenCalled())
    expect(wk.updateSession).not.toHaveBeenCalled()
  })

  it('skips a session that does not cover the active Safe chain', async () => {
    const session = makeSession('topic-1', ['eip155:137']) // no eip155:1
    const wk = makeWalletKit({ 'topic-1': session })
    const store = createTestStore({
      activeSafe: { address: safeAddress, chainId: '1' },
      [walletKitSliceName]: { sessions: { 'topic-1': session }, pending: [], outstandingRequests: {} },
    } as never)

    renderHookWithStore(() => useActiveSafeBinding(wk), store)

    // The effect reads the live snapshot synchronously; once it has, an uncovered chain
    // means updateSession must never fire. (Avoids a raw setTimeout, which hangs under the
    // global jest.useFakeTimers().)
    await waitFor(() => expect(wk.getActiveSessions).toHaveBeenCalled())
    expect(wk.updateSession).not.toHaveBeenCalled()
  })
})
