import { renderHook, fakerChecksummedAddress } from '@/tests/test-utils'
import { useMigrateProposerLabels } from '../useMigrateProposerLabels'
import { PROPOSER_LABEL_PLACEHOLDER } from '@/features/proposers/constants'
import * as useChainIdModule from '@/hooks/useChainId'
import * as useIsSafeOwnerModule from '@/hooks/useIsSafeOwner'
import * as useIsNestedSafeOwnerModule from '@/hooks/useIsNestedSafeOwner'
import * as useProposersModule from '@/hooks/useProposers'
import * as spacesModule from '@/features/spaces'
import { getStoreInstance } from '@/store'
import type { Delegate } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'

const chainId = '1'

const mockProposers = (results: Delegate[]) => {
  jest.spyOn(useProposersModule, 'default').mockReturnValue({
    data: { results },
    isLoading: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useProposersModule.default>)
}

const addressBookName = (address: string): string | undefined =>
  getStoreInstance().getState().addressBook[chainId]?.[address]

describe('useMigrateProposerLabels', () => {
  const delegate = fakerChecksummedAddress()
  const delegator = fakerChecksummedAddress()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(useChainIdModule, 'default').mockReturnValue(chainId)
    jest.spyOn(useIsSafeOwnerModule, 'default').mockReturnValue(true)
    jest.spyOn(useIsNestedSafeOwnerModule, 'useIsNestedSafeOwner').mockReturnValue(false)
    jest.spyOn(spacesModule, 'useGetSpaceAddressBook').mockReturnValue([])
  })

  it('copies a server-held name into the local address book for a signer', () => {
    mockProposers([{ delegate, delegator, label: 'Alice' }])

    renderHook(() => useMigrateProposerLabels())

    expect(addressBookName(delegate)).toBe('Alice')
  })

  it('migrates for a nested Safe owner, who set the name on the parent Safe', () => {
    jest.spyOn(useIsSafeOwnerModule, 'default').mockReturnValue(false)
    jest.spyOn(useIsNestedSafeOwnerModule, 'useIsNestedSafeOwner').mockReturnValue(true)
    mockProposers([{ delegate, delegator, label: 'Alice' }])

    renderHook(() => useMigrateProposerLabels())

    expect(addressBookName(delegate)).toBe('Alice')
  })

  it('does not persist a name for a viewer who is not a signer', () => {
    jest.spyOn(useIsSafeOwnerModule, 'default').mockReturnValue(false)
    jest.spyOn(useIsNestedSafeOwnerModule, 'useIsNestedSafeOwner').mockReturnValue(false)
    mockProposers([{ delegate, delegator, label: 'Alice' }])

    renderHook(() => useMigrateProposerLabels())

    expect(addressBookName(delegate)).toBeUndefined()
  })

  it('leaves an existing local entry untouched', () => {
    mockProposers([{ delegate, delegator, label: 'Server Name' }])

    renderHook(() => useMigrateProposerLabels(), {
      initialReduxState: { addressBook: { [chainId]: { [delegate]: 'My Own Name' } } },
    })

    expect(addressBookName(delegate)).toBe('My Own Name')
  })

  it('skips the placeholder label, which carries no name', () => {
    mockProposers([{ delegate, delegator, label: PROPOSER_LABEL_PLACEHOLDER }])

    renderHook(() => useMigrateProposerLabels())

    expect(addressBookName(delegate)).toBeUndefined()
  })

  it('skips an empty label', () => {
    mockProposers([{ delegate, delegator, label: '' }])

    renderHook(() => useMigrateProposerLabels())

    expect(addressBookName(delegate)).toBeUndefined()
  })
})
