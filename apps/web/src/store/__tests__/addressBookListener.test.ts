import { makeStore, listenerMiddlewareInstance } from '@/store'
import { upsertAddressBookEntries, removeAddressBookEntry } from '@/store/addressBookSlice'
import { selectNotifications } from '@/store/notificationsSlice'

type AddressBookState = Parameters<typeof makeStore>[0] extends infer S
  ? S extends { addressBook?: infer AB }
    ? AB
    : never
  : never

const setup = (preloadedAddressBook: AddressBookState = {}) => {
  // makeStore re-registers every listener onto the shared module-level
  // listenerMiddlewareInstance, so without clearing first each test would
  // stack another live copy of the listener and fire it N times.
  listenerMiddlewareInstance.clearListeners()
  return makeStore({ addressBook: preloadedAddressBook }, { skipBroadcast: true })
}

const abMessages = (store: ReturnType<typeof setup>) =>
  selectNotifications(store.getState())
    .filter((n) => n.groupKey === 'address-book')
    .map((n) => ({ message: n.message, variant: n.variant }))

describe('addressBookListener', () => {
  it('notifies "added" for a new entry with notify:true', () => {
    const store = setup()

    store.dispatch(upsertAddressBookEntries({ chainIds: ['1'], address: '0xabc', name: 'Alice', notify: true }))

    expect(abMessages(store)).toEqual([{ message: 'Contact added to your address book', variant: 'success' }])
  })

  it('notifies "updated" when renaming an existing entry', () => {
    const store = setup({ '1': { '0xabc': 'Alice' } })

    store.dispatch(upsertAddressBookEntries({ chainIds: ['1'], address: '0xabc', name: 'Alice 2', notify: true }))

    expect(abMessages(store)).toEqual([{ message: 'Contact updated in your address book', variant: 'success' }])
  })

  it('does not notify when the name is unchanged', () => {
    const store = setup({ '1': { '0xabc': 'Alice' } })

    store.dispatch(upsertAddressBookEntries({ chainIds: ['1'], address: '0xabc', name: 'Alice', notify: true }))

    expect(abMessages(store)).toEqual([])
  })

  it('does not notify without the notify flag (side-effect path)', () => {
    const store = setup()

    store.dispatch(upsertAddressBookEntries({ chainIds: ['1'], address: '0xabc', name: 'Alice' }))

    expect(abMessages(store)).toEqual([])
  })

  it('does not notify for an empty or whitespace-only name', () => {
    const store = setup()

    store.dispatch(upsertAddressBookEntries({ chainIds: ['1'], address: '0xabc', name: '   ', notify: true }))

    expect(abMessages(store)).toEqual([])
  })

  it('uses the shared "address-book" groupKey so toasts collapse', () => {
    const store = setup()

    store.dispatch(upsertAddressBookEntries({ chainIds: ['1'], address: '0xabc', name: 'Alice', notify: true }))

    const groupKeys = selectNotifications(store.getState()).map((n) => n.groupKey)
    expect(groupKeys).toContain('address-book')
  })

  it('classifies a partial multi-chain upsert (new on one chain, renamed on another) as "updated"', () => {
    // Present as "Alice" on chain 1, absent on chain 137. A single upsert to
    // "Alice 2" on both chains renames one and adds the other.
    const store = setup({ '1': { '0xabc': 'Alice' } })

    store.dispatch(
      upsertAddressBookEntries({ chainIds: ['1', '137'], address: '0xabc', name: 'Alice 2', notify: true }),
    )

    expect(abMessages(store)).toEqual([{ message: 'Contact updated in your address book', variant: 'success' }])
  })

  it('emits a single notification for a multi-chain new entry', () => {
    const store = setup()

    store.dispatch(upsertAddressBookEntries({ chainIds: ['1', '137'], address: '0xabc', name: 'Alice', notify: true }))

    expect(abMessages(store)).toEqual([{ message: 'Contact added to your address book', variant: 'success' }])
  })

  it('notifies "removed" on delete with notify:true', () => {
    const store = setup({ '1': { '0xabc': 'Alice' } })

    store.dispatch(removeAddressBookEntry({ chainId: '1', address: '0xabc', notify: true }))

    expect(abMessages(store)).toEqual([{ message: 'Contact removed from your address book', variant: 'success' }])
  })

  it('does not notify on delete without the flag', () => {
    const store = setup({ '1': { '0xabc': 'Alice' } })

    store.dispatch(removeAddressBookEntry({ chainId: '1', address: '0xabc' }))

    expect(abMessages(store)).toEqual([])
  })

  it('does not notify on delete of a non-existent entry', () => {
    const store = setup()

    store.dispatch(removeAddressBookEntry({ chainId: '1', address: '0xabc', notify: true }))

    expect(abMessages(store)).toEqual([])
  })

  describe('batch imports', () => {
    // The debounce runs on timers; fake them so the 300ms wait is deterministic
    // and instant instead of a real-clock sleep.
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    // advanceTimersByTimeAsync flushes both the debounce timer and the
    // microtasks that resume the listener's async effect afterwards.
    const flushDebounce = () => jest.advanceTimersByTimeAsync(300)

    it('aggregates a single-network batch import into one notification', async () => {
      const store = setup()
      const notifyBatchId = 'imp1'

      store.dispatch(
        upsertAddressBookEntries({ chainIds: ['1'], address: '0xa', name: 'A', notify: true, notifyBatchId }),
      )
      store.dispatch(
        upsertAddressBookEntries({ chainIds: ['1'], address: '0xb', name: 'B', notify: true, notifyBatchId }),
      )
      store.dispatch(
        upsertAddressBookEntries({ chainIds: ['1'], address: '0xc', name: 'C', notify: true, notifyBatchId }),
      )

      await flushDebounce()

      expect(abMessages(store)).toEqual([{ message: '3 contacts imported to your address book', variant: 'success' }])
    })

    it('calls out the network spread for a multi-network batch import', async () => {
      const store = setup()
      const notifyBatchId = 'imp2'
      const chains = ['1', '137', '8217', '560048', '11155111']

      // 10 rows: 2 addresses on each of 5 networks (mirrors the reported CSV).
      chains.forEach((chainId) => {
        store.dispatch(
          upsertAddressBookEntries({
            chainIds: [chainId],
            address: '0xa',
            name: 'CF local 1',
            notify: true,
            notifyBatchId,
          }),
        )
        store.dispatch(
          upsertAddressBookEntries({
            chainIds: [chainId],
            address: '0xb',
            name: 'CF local 2',
            notify: true,
            notifyBatchId,
          }),
        )
      })

      await flushDebounce()

      expect(abMessages(store)).toEqual([
        {
          message:
            '10 contacts imported to your address book across 5 networks. Only contacts on the current network are shown here',
          variant: 'success',
        },
      ])
    })

    it('keeps two sequential import batches independent (no count leakage via the shared map)', async () => {
      const store = setup()

      // First import: 2 contacts on one network.
      store.dispatch(
        upsertAddressBookEntries({
          chainIds: ['1'],
          address: '0xa',
          name: 'A',
          notify: true,
          notifyBatchId: 'batch-1',
        }),
      )
      store.dispatch(
        upsertAddressBookEntries({
          chainIds: ['1'],
          address: '0xb',
          name: 'B',
          notify: true,
          notifyBatchId: 'batch-1',
        }),
      )
      await flushDebounce()

      // Second, separate import: 3 contacts on one network.
      store.dispatch(
        upsertAddressBookEntries({
          chainIds: ['1'],
          address: '0xc',
          name: 'C',
          notify: true,
          notifyBatchId: 'batch-2',
        }),
      )
      store.dispatch(
        upsertAddressBookEntries({
          chainIds: ['1'],
          address: '0xd',
          name: 'D',
          notify: true,
          notifyBatchId: 'batch-2',
        }),
      )
      store.dispatch(
        upsertAddressBookEntries({
          chainIds: ['1'],
          address: '0xe',
          name: 'E',
          notify: true,
          notifyBatchId: 'batch-2',
        }),
      )
      await flushDebounce()

      expect(abMessages(store)).toEqual([
        { message: '2 contacts imported to your address book', variant: 'success' },
        { message: '3 contacts imported to your address book', variant: 'success' },
      ])
    })
  })
})
