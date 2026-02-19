import { renderHook } from '@/tests/test-utils'
import { usePendingDelegations } from '../usePendingDelegations'
import * as useChainIdModule from '@/hooks/useChainId'
import * as useSafeAddressModule from '@/hooks/useSafeAddress'
import * as useNestedSafeOwnersModule from '@/hooks/useNestedSafeOwners'
import * as useProposersModule from '@/hooks/useProposers'
import * as messagesQueries from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { MessageItem, DateLabel } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import * as totpModule from '@/features/proposers/utils/totp'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'

describe('usePendingDelegations', () => {
  const chainId = '1'
  const safeAddress = checksumAddress(faker.finance.ethereumAddress())
  const parentSafeAddress = checksumAddress(faker.finance.ethereumAddress())
  const delegateAddress = checksumAddress(faker.finance.ethereumAddress())
  const currentTotp = Math.floor(Date.now() / 1000 / 3600)

  const createMessageItem = (
    overrides: Partial<{
      action: 'add' | 'remove' | 'edit'
      delegate: string
      nestedSafe: string
      label: string
      totp: number
      confirmationsSubmitted: number
      confirmationsRequired: number
      messageHash: string
      creationTimestamp: number
    }> = {},
  ): MessageItem => {
    const action = overrides.action ?? 'add'
    const delegate = overrides.delegate ?? delegateAddress
    const nestedSafe = overrides.nestedSafe ?? safeAddress
    const label = overrides.label ?? 'Test Proposer'
    const totp = overrides.totp ?? currentTotp

    return {
      type: 'MESSAGE',
      messageHash: overrides.messageHash ?? `0x${faker.string.hexadecimal({ length: 64 })}`,
      status: 'NEEDS_CONFIRMATION',
      logoUri: null,
      name: null,
      message: {
        domain: { chainId: Number(chainId) },
        types: { Delegate: [{ name: 'delegateAddress', type: 'address' }] },
        primaryType: 'Delegate',
        message: { delegateAddress: delegate, totp },
      },
      creationTimestamp: overrides.creationTimestamp ?? Date.now(),
      modifiedTimestamp: Date.now(),
      confirmationsSubmitted: overrides.confirmationsSubmitted ?? 1,
      confirmationsRequired: overrides.confirmationsRequired ?? 2,
      proposedBy: { value: checksumAddress(faker.finance.ethereumAddress()), name: null, logoUri: null },
      confirmations: [
        {
          owner: { value: checksumAddress(faker.finance.ethereumAddress()), name: null, logoUri: null },
          signature: `0x${faker.string.hexadecimal({ length: 130 })}`,
        },
      ],
      preparedSignature: null,
      origin: JSON.stringify({
        type: 'proposer-delegation',
        action,
        delegate,
        nestedSafe,
        label,
      }),
    }
  }

  const createDateLabel = (): DateLabel => ({
    type: 'DATE_LABEL',
    timestamp: Date.now(),
  })

  const mockRefetch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChainIdModule, 'default').mockReturnValue(chainId)
    jest.spyOn(useSafeAddressModule, 'default').mockReturnValue(safeAddress)
    jest.spyOn(totpModule, 'isTotpValid').mockReturnValue(true)
    jest.spyOn(useProposersModule, 'default').mockReturnValue({
      data: { results: [] },
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useProposersModule.default>)
  })

  it('should return empty array when no parent safe address', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue(null)
    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('should return empty array when no messages', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toEqual([])
  })

  it('should filter out non-MESSAGE type items', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    const messageItem = createMessageItem()
    const dateLabel = createDateLabel()

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [dateLabel, messageItem] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(1)
    expect(result.current.pendingDelegations[0].messageHash).toBe(messageItem.messageHash)
  })

  it('should filter out messages for different nested safes', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    const otherNestedSafe = checksumAddress(faker.finance.ethereumAddress())
    const messageForOtherSafe = createMessageItem({ nestedSafe: otherNestedSafe })
    const messageForCurrentSafe = createMessageItem()

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [messageForOtherSafe, messageForCurrentSafe] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(1)
    expect(result.current.pendingDelegations[0].messageHash).toBe(messageForCurrentSafe.messageHash)
  })

  it('should filter out expired delegations (invalid TOTP)', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    const expiredMessage = createMessageItem({ totp: currentTotp - 10 })
    const validMessage = createMessageItem()

    jest.spyOn(totpModule, 'isTotpValid').mockImplementation((totp) => totp === currentTotp)

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [expiredMessage, validMessage] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(1)
    expect(result.current.pendingDelegations[0].messageHash).toBe(validMessage.messageHash)
  })

  it('should correctly parse delegation origin from message', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    const delegate = checksumAddress(faker.finance.ethereumAddress())
    const messageItem = createMessageItem({ delegate, action: 'remove' })

    // For remove action, the delegate must exist in proposers list (otherwise it's filtered out)
    jest.spyOn(useProposersModule, 'default').mockReturnValue({
      data: { results: [{ delegate, label: 'Existing Label' }] },
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useProposersModule.default>)

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [messageItem] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(1)
    expect(result.current.pendingDelegations[0].action).toBe('remove')
    expect(result.current.pendingDelegations[0].delegateAddress).toBe(delegate)
    expect(result.current.pendingDelegations[0].delegateLabel).toBe('Test Proposer')
    expect(result.current.pendingDelegations[0].nestedSafeAddress).toBe(safeAddress)
    expect(result.current.pendingDelegations[0].parentSafeAddress).toBe(parentSafeAddress)
  })

  it('should derive pending status when confirmations < required', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    const messageItem = createMessageItem({
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
    })

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [messageItem] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations[0].status).toBe('pending')
  })

  it('should derive ready status when confirmations >= required', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    const messageItem = createMessageItem({
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [messageItem] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations[0].status).toBe('ready')
  })

  it('should keep only the latest delegation per delegate', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    const olderMessage = createMessageItem({
      delegate: delegateAddress,
      creationTimestamp: 1000,
      messageHash: '0xolder',
    })
    const newerMessage = createMessageItem({
      delegate: delegateAddress,
      creationTimestamp: 2000,
      messageHash: '0xnewer',
    })

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [olderMessage, newerMessage] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(1)
    expect(result.current.pendingDelegations[0].messageHash).toBe('0xnewer')
  })

  it('should filter out add delegation when delegate already exists', () => {
    const existingDelegate = checksumAddress(faker.finance.ethereumAddress())
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    jest.spyOn(useProposersModule, 'default').mockReturnValue({
      data: { results: [{ delegate: existingDelegate, label: 'Existing Label' }] },
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useProposersModule.default>)

    const addMessage = createMessageItem({ delegate: existingDelegate, action: 'add' })

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [addMessage] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(0)
  })

  it('should filter out remove delegation when delegate does not exist', () => {
    const nonExistentDelegate = checksumAddress(faker.finance.ethereumAddress())
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    jest.spyOn(useProposersModule, 'default').mockReturnValue({
      data: { results: [] },
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useProposersModule.default>)

    const removeMessage = createMessageItem({ delegate: nonExistentDelegate, action: 'remove' })

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [removeMessage] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(0)
  })

  it('should keep add delegation when delegate does not exist yet', () => {
    const newDelegate = checksumAddress(faker.finance.ethereumAddress())
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    jest.spyOn(useProposersModule, 'default').mockReturnValue({
      data: { results: [] },
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useProposersModule.default>)

    const addMessage = createMessageItem({ delegate: newDelegate, action: 'add' })

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [addMessage] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(1)
    expect(result.current.pendingDelegations[0].action).toBe('add')
  })

  it('should keep remove delegation when delegate exists', () => {
    const existingDelegate = checksumAddress(faker.finance.ethereumAddress())
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    jest.spyOn(useProposersModule, 'default').mockReturnValue({
      data: { results: [{ delegate: existingDelegate, label: 'Existing Label' }] },
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useProposersModule.default>)

    const removeMessage = createMessageItem({ delegate: existingDelegate, action: 'remove' })

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [removeMessage] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(1)
    expect(result.current.pendingDelegations[0].action).toBe('remove')
  })

  it('should skip query when no parent safe address', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue(null)
    const mockQuery = jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    renderHook(() => usePendingDelegations())

    expect(mockQuery).toHaveBeenCalledWith({ chainId, safeAddress: '' }, expect.objectContaining({ skip: true }))
  })

  it('should return refetch function', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.refetch).toBe(mockRefetch)
  })

  it('should filter out messages with invalid origin', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    const validMessage = createMessageItem()
    const invalidOriginMessage: MessageItem = {
      ...createMessageItem(),
      messageHash: '0xinvalid',
      origin: 'not-a-json-origin',
    }
    const wrongTypeOriginMessage: MessageItem = {
      ...createMessageItem(),
      messageHash: '0xwrongtype',
      origin: JSON.stringify({ type: 'other-type', action: 'add' }),
    }

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [validMessage, invalidOriginMessage, wrongTypeOriginMessage] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(1)
    expect(result.current.pendingDelegations[0].messageHash).toBe(validMessage.messageHash)
  })

  it('should keep edit delegation when delegate exists and label is different', () => {
    const existingDelegate = checksumAddress(faker.finance.ethereumAddress())
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    jest.spyOn(useProposersModule, 'default').mockReturnValue({
      data: { results: [{ delegate: existingDelegate, label: 'Old Label' }] },
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useProposersModule.default>)

    const editMessage = createMessageItem({ delegate: existingDelegate, action: 'edit', label: 'New Label' })

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [editMessage] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(1)
    expect(result.current.pendingDelegations[0].action).toBe('edit')
  })

  it('should filter out edit delegation when delegate does not exist', () => {
    const nonExistentDelegate = checksumAddress(faker.finance.ethereumAddress())
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    jest.spyOn(useProposersModule, 'default').mockReturnValue({
      data: { results: [] },
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useProposersModule.default>)

    const editMessage = createMessageItem({ delegate: nonExistentDelegate, action: 'edit', label: 'New Label' })

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [editMessage] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(0)
  })

  it('should filter out edit delegation when label already matches (edit was applied)', () => {
    const existingDelegate = checksumAddress(faker.finance.ethereumAddress())
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    jest.spyOn(useProposersModule, 'default').mockReturnValue({
      data: { results: [{ delegate: existingDelegate, label: 'Updated Label' }] },
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useProposersModule.default>)

    // Pending edit with same label as current - means edit was already applied
    const editMessage = createMessageItem({ delegate: existingDelegate, action: 'edit', label: 'Updated Label' })

    jest.spyOn(messagesQueries, 'useMessagesGetMessagesBySafeV1Query').mockReturnValue({
      data: { results: [editMessage] },
      isLoading: false,
      refetch: mockRefetch,
    } as ReturnType<typeof messagesQueries.useMessagesGetMessagesBySafeV1Query>)

    const { result } = renderHook(() => usePendingDelegations())

    expect(result.current.pendingDelegations).toHaveLength(0)
  })
})
