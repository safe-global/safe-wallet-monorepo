import { buildDelegationOrigin, createDelegationMessage, confirmDelegationMessage } from '../delegationMessages'
import type { TypedData, MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { AppDispatch } from '@/store'

describe('delegationMessages', () => {
  const chainId = '1'
  const parentSafeAddress = checksumAddress(faker.finance.ethereumAddress())
  const delegateAddress = checksumAddress(faker.finance.ethereumAddress())
  const nestedSafeAddress = checksumAddress(faker.finance.ethereumAddress())
  const signature = `0x${faker.string.hexadecimal({ length: 130 })}`
  const messageHash = `0x${faker.string.hexadecimal({ length: 64 })}`

  const createTypedData = (delegate: string = delegateAddress): TypedData => ({
    domain: { chainId: Number(chainId) },
    types: { Delegate: [{ name: 'delegateAddress', type: 'address' }] },
    primaryType: 'Delegate',
    message: { delegateAddress: delegate },
  })

  describe('buildDelegationOrigin', () => {
    it('should build correct JSON string for add action', () => {
      const result = buildDelegationOrigin('add', delegateAddress, nestedSafeAddress, 'Test Label')

      const parsed = JSON.parse(result)
      expect(parsed).toEqual({
        type: 'proposer-delegation',
        action: 'add',
        delegate: delegateAddress,
        nestedSafe: nestedSafeAddress,
        label: 'Test Label',
      })
    })

    it('should build correct JSON string for remove action', () => {
      const result = buildDelegationOrigin('remove', delegateAddress, nestedSafeAddress, 'Remove Label')

      const parsed = JSON.parse(result)
      expect(parsed).toEqual({
        type: 'proposer-delegation',
        action: 'remove',
        delegate: delegateAddress,
        nestedSafe: nestedSafeAddress,
        label: 'Remove Label',
      })
    })

    it('should include all required fields for proper delegation origin', () => {
      const result = buildDelegationOrigin('add', delegateAddress, nestedSafeAddress, 'My Label')

      const parsed = JSON.parse(result)
      expect(parsed.type).toBe('proposer-delegation')
      expect(parsed.action).toBeDefined()
      expect(parsed.delegate).toBeDefined()
      expect(parsed.nestedSafe).toBeDefined()
      expect(parsed.label).toBeDefined()
    })
  })

  describe('createDelegationMessage', () => {
    const typedData = createTypedData()
    const origin = buildDelegationOrigin('add', delegateAddress, nestedSafeAddress, 'Test')

    it('should successfully create message by dispatching correct action', async () => {
      const mockUnwrap = jest.fn().mockResolvedValue({})
      const mockDispatch = jest.fn().mockReturnValue({ unwrap: mockUnwrap })

      await createDelegationMessage(
        mockDispatch as unknown as AppDispatch,
        chainId,
        parentSafeAddress,
        typedData,
        signature,
        origin,
      )

      expect(mockDispatch).toHaveBeenCalled()
      expect(mockUnwrap).toHaveBeenCalled()
    })

    it('should confirm existing message when 400 "already exists" error with same action', async () => {
      const existingMessage: MessageItem = {
        type: 'MESSAGE',
        messageHash,
        status: 'NEEDS_CONFIRMATION',
        logoUri: null,
        name: null,
        message: {
          domain: { chainId: Number(chainId) },
          types: { Delegate: [{ name: 'delegateAddress', type: 'address' }] },
          primaryType: 'Delegate',
          message: { delegateAddress: delegateAddress.toLowerCase() },
        },
        creationTimestamp: Date.now(),
        modifiedTimestamp: Date.now(),
        confirmationsSubmitted: 1,
        confirmationsRequired: 2,
        proposedBy: { value: checksumAddress(faker.finance.ethereumAddress()), name: null, logoUri: null },
        confirmations: [],
        preparedSignature: null,
        origin: JSON.stringify({
          type: 'proposer-delegation',
          action: 'add',
          delegate: delegateAddress,
          nestedSafe: nestedSafeAddress,
          label: 'Test',
        }),
      }

      let callCount = 0
      const mockDispatch = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: messagesCreateMessageV1 - fails with 400
          return {
            unwrap: jest.fn().mockRejectedValue({
              status: 400,
              data: { message: 'Message already exists for that Safe' },
            }),
          }
        } else if (callCount === 2) {
          // Second call: messagesGetMessagesBySafeV1 - returns existing message
          return {
            unwrap: jest.fn().mockResolvedValue({
              results: [existingMessage],
            }),
          }
        } else {
          // Third call: messagesUpdateMessageSignatureV1 - succeeds
          return {
            unwrap: jest.fn().mockResolvedValue({}),
          }
        }
      })

      await createDelegationMessage(
        mockDispatch as unknown as AppDispatch,
        chainId,
        parentSafeAddress,
        typedData,
        signature,
        origin,
      )

      // Should have called 3 times: create (failed), get (found), update (confirmed)
      expect(mockDispatch).toHaveBeenCalledTimes(3)
    })

    it('should throw descriptive error when 400 "already exists" error with different action', async () => {
      const existingMessage: MessageItem = {
        type: 'MESSAGE',
        messageHash,
        status: 'NEEDS_CONFIRMATION',
        logoUri: null,
        name: null,
        message: {
          domain: { chainId: Number(chainId) },
          types: { Delegate: [{ name: 'delegateAddress', type: 'address' }] },
          primaryType: 'Delegate',
          message: { delegateAddress: delegateAddress.toLowerCase() },
        },
        creationTimestamp: Date.now(),
        modifiedTimestamp: Date.now(),
        confirmationsSubmitted: 1,
        confirmationsRequired: 2,
        proposedBy: { value: checksumAddress(faker.finance.ethereumAddress()), name: null, logoUri: null },
        confirmations: [],
        preparedSignature: null,
        origin: JSON.stringify({
          type: 'proposer-delegation',
          action: 'remove', // Different action
          delegate: delegateAddress,
          nestedSafe: nestedSafeAddress,
          label: 'Test',
        }),
      }

      let callCount = 0
      const mockDispatch = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            unwrap: jest.fn().mockRejectedValue({
              status: 400,
              data: { message: 'Message already exists for that Safe' },
            }),
          }
        } else {
          return {
            unwrap: jest.fn().mockResolvedValue({
              results: [existingMessage],
            }),
          }
        }
      })

      await expect(
        createDelegationMessage(
          mockDispatch as unknown as AppDispatch,
          chainId,
          parentSafeAddress,
          typedData,
          signature,
          origin,
        ),
      ).rejects.toThrow(
        'A pending "remove" delegation already exists for this proposer. Please wait for it to expire (~1 hour) before initiating a "add" action.',
      )
    })

    it('should re-throw other errors', async () => {
      const networkError = new Error('Network error')
      const mockDispatch = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockRejectedValue(networkError),
      })

      await expect(
        createDelegationMessage(
          mockDispatch as unknown as AppDispatch,
          chainId,
          parentSafeAddress,
          typedData,
          signature,
          origin,
        ),
      ).rejects.toThrow('Network error')
    })

    it('should re-throw 400 errors that are not "already exists"', async () => {
      const validationError = {
        status: 400,
        data: { message: 'Invalid signature' },
      }
      const mockDispatch = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockRejectedValue(validationError),
      })

      await expect(
        createDelegationMessage(
          mockDispatch as unknown as AppDispatch,
          chainId,
          parentSafeAddress,
          typedData,
          signature,
          origin,
        ),
      ).rejects.toEqual(validationError)
    })
  })

  describe('confirmDelegationMessage', () => {
    it('should dispatch messagesUpdateMessageSignatureV1 action', async () => {
      const mockUnwrap = jest.fn().mockResolvedValue({})
      const mockDispatch = jest.fn().mockReturnValue({ unwrap: mockUnwrap })

      await confirmDelegationMessage(mockDispatch as unknown as AppDispatch, chainId, messageHash, signature)

      expect(mockDispatch).toHaveBeenCalled()
      expect(mockUnwrap).toHaveBeenCalled()
    })

    it('should throw error when confirmation fails', async () => {
      const error = new Error('Confirmation failed')
      const mockDispatch = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockRejectedValue(error),
      })

      await expect(
        confirmDelegationMessage(mockDispatch as unknown as AppDispatch, chainId, messageHash, signature),
      ).rejects.toThrow('Confirmation failed')
    })
  })
})
