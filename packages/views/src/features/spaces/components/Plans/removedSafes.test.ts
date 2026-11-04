import { removedSafesNote, summarizeRemovedSafes } from './removedSafes'

const a1 = { chainId: '1', address: '0xA' }
const a10 = { chainId: '10', address: '0xA' }
const b1 = { chainId: '1', address: '0xB' }
const c1 = { chainId: '1', address: '0xC' }
const leaves = [a1, a10, b1, c1]

describe('summarizeRemovedSafes', () => {
  it('counts a Safe removed on every network as one account', () => {
    expect(summarizeRemovedSafes(leaves, [a1, a10, b1])).toEqual({
      accounts: 2,
      partialAccounts: 0,
      partialNetworks: 0,
    })
  })

  it('keeps a Safe removed on some networks apart from the accounts', () => {
    expect(summarizeRemovedSafes(leaves, [a10])).toEqual({ accounts: 0, partialAccounts: 1, partialNetworks: 1 })
  })

  it('tells whole accounts from partial networks in one list', () => {
    expect(summarizeRemovedSafes(leaves, [a10, b1])).toEqual({ accounts: 1, partialAccounts: 1, partialNetworks: 1 })
  })

  it('matches addresses regardless of case', () => {
    expect(summarizeRemovedSafes(leaves, [{ chainId: '10', address: '0xa' }])).toEqual({
      accounts: 0,
      partialAccounts: 1,
      partialNetworks: 1,
    })
  })

  it('takes every removed Safe as a whole account when the leaves are not known', () => {
    expect(summarizeRemovedSafes([], [a1, a10])).toEqual({ accounts: 1, partialAccounts: 0, partialNetworks: 0 })
  })
})

describe('removedSafesNote', () => {
  it('is empty when nothing is removed', () => {
    expect(removedSafesNote({ accounts: 0, partialAccounts: 0, partialNetworks: 0 })).toBe('')
  })

  it('names the accounts leaving the Workspace', () => {
    expect(removedSafesNote({ accounts: 1, partialAccounts: 0, partialNetworks: 0 })).toBe(
      '1 Safe account will be removed from the Workspace. It remains available in My accounts.',
    )
    expect(removedSafesNote({ accounts: 3, partialAccounts: 0, partialNetworks: 0 })).toBe(
      '3 Safe accounts will be removed from the Workspace. They remain available in My accounts.',
    )
  })

  it('says a Safe losing networks keeps its seat, with its exact network count', () => {
    expect(removedSafesNote({ accounts: 0, partialAccounts: 1, partialNetworks: 1 })).toBe(
      '1 Safe account will be removed from 1 of its networks only. It stays in the Workspace and keeps its seat.',
    )
    expect(removedSafesNote({ accounts: 0, partialAccounts: 1, partialNetworks: 2 })).toBe(
      '1 Safe account will be removed from 2 of its networks only. It stays in the Workspace and keeps its seat.',
    )
  })

  it('does not total the networks over several partial Safes, which would read as each losing that many', () => {
    expect(removedSafesNote({ accounts: 0, partialAccounts: 2, partialNetworks: 3 })).toBe(
      '2 Safe accounts will be removed from some of their networks only. They stay in the Workspace and keep their seats.',
    )
  })

  it('covers both in one sentence when the list mixes them, agreeing in number on each side', () => {
    expect(removedSafesNote({ accounts: 1, partialAccounts: 1, partialNetworks: 1 })).toBe(
      '1 Safe account will be removed from the Workspace, and 1 more from 1 of its networks only. The removed account remains available in My accounts, the other keeps its seat.',
    )
    expect(removedSafesNote({ accounts: 2, partialAccounts: 2, partialNetworks: 3 })).toBe(
      '2 Safe accounts will be removed from the Workspace, and 2 more from some of their networks only. The removed accounts remain available in My accounts, the others keep their seats.',
    )
  })
})
