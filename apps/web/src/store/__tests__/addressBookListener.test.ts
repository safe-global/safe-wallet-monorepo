import { makeStore } from '@/store'
import { upsertAddressBookEntries, removeAddressBookEntry } from '@/store/addressBookSlice'
import { selectNotifications } from '@/store/notificationsSlice'

type AddressBookState = Parameters<typeof makeStore>[0] extends infer S
  ? S extends { addressBook?: infer AB }
    ? AB
    : never
  : never

const setup = (preloadedAddressBook: AddressBookState = {}) =>
  makeStore({ addressBook: preloadedAddressBook }, { skipBroadcast: true })

const abMessages = (store: ReturnType<typeof setup>) =>
  selectNotifications(store.getState())
    .filter((n) => n.groupKey === 'address-book')
    .map((n) => ({ message: n.message, variant: n.variant }))

describe('addressBookListener', () => {
  it('notifies "added" for a new entry with notify:true', () => {
    const store = setup()

    store.dispatch(upsertAddressBookEntries({ chainIds: ['1'], address: '0xabc', name: 'Alice', notify: true }))

    expect(abMessages(store)).toEqual([{ message: 'Alice added to address book', variant: 'success' }])
  })

  it('notifies "updated" when renaming an existing entry', () => {
    const store = setup({ '1': { '0xabc': 'Alice' } })

    store.dispatch(upsertAddressBookEntries({ chainIds: ['1'], address: '0xabc', name: 'Alice 2', notify: true }))

    expect(abMessages(store)).toEqual([{ message: 'Alice 2 updated in address book', variant: 'success' }])
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

  it('emits a single notification for a multi-chain new entry', () => {
    const store = setup()

    store.dispatch(upsertAddressBookEntries({ chainIds: ['1', '137'], address: '0xabc', name: 'Alice', notify: true }))

    expect(abMessages(store)).toEqual([{ message: 'Alice added to address book', variant: 'success' }])
  })

  it('notifies "removed" on delete with notify:true', () => {
    const store = setup({ '1': { '0xabc': 'Alice' } })

    store.dispatch(removeAddressBookEntry({ chainId: '1', address: '0xabc', notify: true }))

    expect(abMessages(store)).toEqual([{ message: 'Contact removed from address book', variant: 'info' }])
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

    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(abMessages(store)).toEqual([{ message: '3 contacts imported to address book', variant: 'success' }])
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

    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(abMessages(store)).toEqual([
      {
        message: '10 contacts imported across 5 networks. Only contacts on the current network are shown here',
        variant: 'success',
      },
    ])
  })
})
