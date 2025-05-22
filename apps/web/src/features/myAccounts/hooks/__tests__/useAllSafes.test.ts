import * as allOwnedSafes from '@/features/myAccounts/hooks/useAllOwnedSafes'
import useAllSafes, { _buildSafeItem, _prepareAddresses } from '@/features/myAccounts/hooks/useAllSafes'
import * as useChains from '@/hooks/useChains'
import * as useWallet from '@/hooks/wallets/useWallet'
import { renderHook } from '@/tests/test-utils'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { UndeployedSafe } from '@safe-global/utils/features/counterfactual/store/types'

describe('useAllSafes hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([undefined, undefined, false])
    jest.spyOn(useChains, 'default').mockImplementation(() => ({
      configs: [{ chainId: '1' } as ChainInfo],
    }))
  })

  it('returns an empty array if there is no wallet and allOwned is undefined', () => {
    jest.spyOn(useWallet, 'default').mockReturnValue(null)
    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([undefined, undefined, false])

    const { result } = renderHook(() => useAllSafes())

    expect(result.current).toEqual([])
  })

  it('returns an empty array if the chains config is empty', () => {
    jest.spyOn(useChains, 'default').mockReturnValue({ configs: [] })

    const { result } = renderHook(() => useAllSafes())

    expect(result.current).toEqual([])
  })

  it('returns SafeItems for added safes', () => {
    const { result } = renderHook(() => useAllSafes(), {
      initialReduxState: {
        addedSafes: {
          '1': {
            '0x123': {
              owners: [],
              threshold: 1,
            },
          },
        },
      },
    })

    expect(result.current).toEqual([
      {
        address: '0x123',
        chainId: '1',
        isPinned: true,
        isReadOnly: true,
        lastVisited: 0,
        name: undefined,
      },
    ])
  })

  it('returns SafeItems for owned safes', () => {
    const mockOwnedSafes = {
      '1': ['0x123', '0x456', '0x789'],
    }

    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([mockOwnedSafes, undefined, false])

    const { result } = renderHook(() => useAllSafes())

    expect(result.current).toEqual([
      { address: '0x123', chainId: '1', isPinned: false, isReadOnly: false, lastVisited: 0, name: undefined },
      { address: '0x456', chainId: '1', isPinned: false, isReadOnly: false, lastVisited: 0, name: undefined },
      { address: '0x789', chainId: '1', isPinned: false, isReadOnly: false, lastVisited: 0, name: undefined },
    ])
  })

  it('returns SafeItems for undeployed safes', () => {
    const { result } = renderHook(() => useAllSafes(), {
      initialReduxState: {
        undeployedSafes: {
          '1': {
            '0x123': {
              status: {} as UndeployedSafe['status'],
              props: {
                safeAccountConfig: {
                  owners: ['0x111'],
                },
              } as UndeployedSafe['props'],
            },
          },
        },
      },
    })

    expect(result.current).toEqual([
      {
        address: '0x123',
        chainId: '1',
        isPinned: false,
        isReadOnly: true,
        lastVisited: 0,
        name: undefined,
      },
    ])
  })

  it('returns SafeItems for added safes and owned safes', () => {
    const mockOwnedSafes = {
      '1': ['0x456', '0x789'],
    }
    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([mockOwnedSafes, undefined, false])

    const { result } = renderHook(() => useAllSafes(), {
      initialReduxState: {
        addedSafes: {
          '1': {
            '0x123': {
              owners: [],
              threshold: 1,
            },
          },
        },
      },
    })

    expect(result.current).toEqual([
      { address: '0x123', chainId: '1', isPinned: true, isReadOnly: true, lastVisited: 0, name: undefined },
      { address: '0x456', chainId: '1', isPinned: false, isReadOnly: false, lastVisited: 0, name: undefined },
      { address: '0x789', chainId: '1', isPinned: false, isReadOnly: false, lastVisited: 0, name: undefined },
    ])
  })

  it('returns SafeItems for added safes and undeployed safes sorted', () => {
    const { result } = renderHook(() => useAllSafes(), {
      initialReduxState: {
        addedSafes: {
          '1': {
            '0x123': {
              owners: [],
              threshold: 1,
            },
          },
        },
        undeployedSafes: {
          '1': {
            '0x456': {
              status: {} as UndeployedSafe['status'],
              props: {
                safeAccountConfig: {
                  owners: ['0x111'],
                },
              } as UndeployedSafe['props'],
            },
          },
        },
      },
    })

    expect(result.current).toEqual([
      { address: '0x123', chainId: '1', isPinned: true, isReadOnly: true, lastVisited: 0, name: undefined },
      { address: '0x456', chainId: '1', isPinned: false, isReadOnly: true, lastVisited: 0, name: undefined },
    ])
  })

  it('returns SafeItems for owned safes and undeployed safes sorted', () => {
    const mockOwnedSafes = {
      '1': ['0x456', '0x789'],
    }
    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([mockOwnedSafes, undefined, false])

    const { result } = renderHook(() => useAllSafes(), {
      initialReduxState: {
        undeployedSafes: {
          '1': {
            '0x123': {
              status: {} as UndeployedSafe['status'],
              props: {
                safeAccountConfig: {
                  owners: ['0x111'],
                },
              } as UndeployedSafe['props'],
            },
          },
        },
      },
    })

    expect(result.current).toEqual([
      { address: '0x123', chainId: '1', isPinned: false, isReadOnly: true, lastVisited: 0, name: undefined },
      { address: '0x456', chainId: '1', isPinned: false, isReadOnly: false, lastVisited: 0, name: undefined },
      { address: '0x789', chainId: '1', isPinned: false, isReadOnly: false, lastVisited: 0, name: undefined },
    ])
  })

  it('returns SafeItems for added, owned and undeployed safes sorted', () => {
    const mockOwnedSafes = {
      '1': ['0x456', '0x789'],
    }
    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([mockOwnedSafes, undefined, false])

    const { result } = renderHook(() => useAllSafes(), {
      initialReduxState: {
        addedSafes: {
          '1': {
            '0x123': {
              owners: [],
              threshold: 1,
            },
          },
        },
        undeployedSafes: {
          '1': {
            '0x321': {
              status: {} as UndeployedSafe['status'],
              props: {
                safeAccountConfig: {
                  owners: ['0x111'],
                },
              } as UndeployedSafe['props'],
            },
          },
        },
      },
    })

    expect(result.current).toEqual([
      { address: '0x123', chainId: '1', isPinned: true, isReadOnly: true, lastVisited: 0, name: undefined },
      { address: '0x321', chainId: '1', isPinned: false, isReadOnly: true, lastVisited: 0, name: undefined },
      { address: '0x456', chainId: '1', isPinned: false, isReadOnly: false, lastVisited: 0, name: undefined },
      { address: '0x789', chainId: '1', isPinned: false, isReadOnly: false, lastVisited: 0, name: undefined },
    ])
  })

  describe('buildSafeItem', () => {
    const mockAllAdded = {
      '1': {
        '0x123': {
          owners: [],
          threshold: 1,
        },
      },
    }

    const mockAllOwned = {
      '1': ['0x456'],
    }

    const mockAllUndeployed = {}

    const mockAllVisited = {}
    const mockAllSafeNames = {}

    it('returns a pinned SafeItem if its an added safe', () => {
      const result = _buildSafeItem(
        '1',
        '0x123',
        '0x111',
        mockAllAdded,
        mockAllOwned,
        mockAllUndeployed,
        mockAllVisited,
        mockAllSafeNames,
      )

      expect(result).toEqual({
        address: '0x123',
        chainId: '1',
        isPinned: true,
        isReadOnly: true,
        lastVisited: 0,
        name: undefined,
      })
    })

    it('returns a SafeItem with lastVisited of non-zero if there is an entry', () => {
      const mockAllVisited = {
        '1': {
          '0x123': {
            lastVisited: 123456,
          },
        },
      }

      const result = _buildSafeItem(
        '1',
        '0x123',
        '0x111',
        mockAllAdded,
        mockAllOwned,
        mockAllUndeployed,
        mockAllVisited,
        mockAllSafeNames,
      )

      expect(result.lastVisited).toEqual(123456)
    })

    it('returns a SafeItem with readOnly true if its an added safe', () => {
      const mockAllAdded = {
        '1': {
          '0x123': {
            owners: [{ value: '0x222' }],
            threshold: 1,
          },
        },
      }
      const result = _buildSafeItem(
        '1',
        '0x123',
        '0x111',
        mockAllAdded,
        mockAllOwned,
        mockAllUndeployed,
        mockAllVisited,
        mockAllSafeNames,
      )

      expect(result.isReadOnly).toEqual(true)
    })

    it('returns a SafeItem with readOnly false if wallet is an owner of undeployed safe', () => {
      const mockAllUndeployed = {
        '1': {
          '0x123': {
            status: {} as UndeployedSafe['status'],
            props: {
              safeAccountConfig: {
                owners: ['0x111'],
              },
            } as UndeployedSafe['props'],
          },
        },
      }
      const result = _buildSafeItem(
        '1',
        '0x123',
        '0x111',
        mockAllAdded,
        mockAllOwned,
        mockAllUndeployed,
        mockAllVisited,
        mockAllSafeNames,
      )

      expect(result.isReadOnly).toEqual(false)
    })

    it('returns a SafeItem with readOnly false if it is an owned safe', () => {
      const result = _buildSafeItem(
        '1',
        '0x456',
        '0x111',
        mockAllAdded,
        mockAllOwned,
        mockAllUndeployed,
        mockAllVisited,
        mockAllSafeNames,
      )

      expect(result.isReadOnly).toEqual(false)
    })

    it('returns a SafeItem with name if it exists in the address book', () => {
      const mockAllSafeNames = {
        '1': {
          '0x123': 'My test safe',
        },
      }
      const result = _buildSafeItem(
        '1',
        '0x123',
        '0x111',
        mockAllAdded,
        mockAllOwned,
        mockAllUndeployed,
        mockAllVisited,
        mockAllSafeNames,
      )

      expect(result.name).toEqual('My test safe')
    })
  })

  describe('prepareAddresses', () => {
    const mockAdded = {}
    const mockOwned = {}
    const mockUndeployed = {}

    it('returns an empty array if there are no addresses', () => {
      const result = _prepareAddresses('1', mockAdded, mockOwned, mockUndeployed)

      expect(result).toEqual([])
    })

    it('returns added safe addresses', () => {
      const mockAdded = {
        '1': {
          '0x123': {
            owners: [{ value: '0x111' }],
            threshold: 1,
          },
        },
      }

      const result = _prepareAddresses('1', mockAdded, mockOwned, mockUndeployed)

      expect(result).toEqual(['0x123'])
    })

    it('returns owned safe addresses', () => {
      const mockOwned = {
        '1': ['0x456'],
      }
      const result = _prepareAddresses('1', mockAdded, mockOwned, mockUndeployed)

      expect(result).toEqual(['0x456'])
    })

    it('returns undeployed safe addresses', () => {
      const mockUndeployed = {
        '1': {
          '0x789': {} as UndeployedSafe,
        },
      }

      const result = _prepareAddresses('1', mockAdded, mockOwned, mockUndeployed)

      expect(result).toEqual(['0x789'])
    })

    it('remove duplicates', () => {
      const mockAdded = {
        '1': {
          '0x123': {
            owners: [{ value: '0x111' }],
            threshold: 1,
          },
        },
      }

      const mockOwned = {
        '1': ['0x123'],
      }

      const mockUndeployed = {
        '1': {
          '0x123': {} as UndeployedSafe,
        },
      }
      const result = _prepareAddresses('1', mockAdded, mockOwned, mockUndeployed)

      expect(result).toEqual(['0x123'])
    })

    it('concatenates safe addresses', () => {
      const mockAdded = {
        '1': {
          '0x123': {
            owners: [{ value: '0x111' }],
            threshold: 1,
          },
        },
      }

      const mockOwned = {
        '1': ['0x456'],
      }

      const mockUndeployed = {
        '1': {
          '0x789': {} as UndeployedSafe,
        },
      }
      const result = _prepareAddresses('1', mockAdded, mockOwned, mockUndeployed)

      expect(result).toEqual(['0x123', '0x456', '0x789'])
    })
  })
})
