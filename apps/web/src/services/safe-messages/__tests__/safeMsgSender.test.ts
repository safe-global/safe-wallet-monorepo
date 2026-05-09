import { MockEip1193Provider } from '@/tests/mocks/providers'
import type { JsonRpcSigner } from 'ethers'
import { zeroPadBytes } from 'ethers'

import { dispatchSafeMsgConfirmation, dispatchSafeMsgProposal } from '@/services/safe-messages/safeMsgSender'
import * as utils from '@safe-global/utils/utils/safe-messages'
import * as events from '@/services/safe-messages/safeMsgEvents'
import * as sdk from '@/services/tx/tx-sender/sdk'
import { zeroPadValue } from 'ethers'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { makeStore, setStoreInstance } from '@/store'

const mockValidSignature = `${zeroPadBytes('0x0456', 64)}1c`
const mockSignatureWithInvalidV = `${zeroPadBytes('0x0456', 64)}01`
describe('safeMsgSender', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Initialize the store for imperative usage
    const store = makeStore(undefined, { skipBroadcast: true })
    setStoreInstance(store)

    jest.spyOn(utils, 'generateSafeMessageHash').mockImplementation(() => '0x0123')

    jest.spyOn(sdk, 'getAssertedChainSigner').mockResolvedValue({
      signTypedData: jest.fn().mockImplementation(() => Promise.resolve(mockValidSignature)),
    } as unknown as JsonRpcSigner)
  })

  describe('dispatchSafeMsgProposal', () => {
    it('should dispatch a message proposal', async () => {
      // Mock MSW handler for message creation
      let capturedRequest: any
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/messages`, async ({ request, params }) => {
          capturedRequest = {
            params,
            body: await request.json(),
          }
          return HttpResponse.json({})
        }),
      )

      const safeMsgDispatchSpy = jest.spyOn(events, 'safeMsgDispatch')

      const safe = {
        version: '1.3.0',
        chainId: '5',
        address: {
          value: zeroPadValue('0x0789', 20),
        },
      } as unknown as SafeState
      const message = 'Hello world'
      const origin = 'http://example.com'

      await dispatchSafeMsgProposal({ provider: MockEip1193Provider, safe, message, origin })

      expect(capturedRequest.params.chainId).toBe('5')
      expect(capturedRequest.params.safeAddress).toBe(zeroPadValue('0x0789', 20))
      expect(capturedRequest.body).toEqual({
        message,
        signature: mockValidSignature,
        origin,
      })

      expect(safeMsgDispatchSpy).toHaveBeenCalledWith(events.SafeMsgEvent.PROPOSE, {
        messageHash: '0x0123',
      })
    })

    it('should normalize EIP712 messages', async () => {
      // Mock MSW handler for message creation
      let capturedRequest: any
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/messages`, async ({ request }) => {
          capturedRequest = {
            body: await request.json(),
          }
          return HttpResponse.json({})
        }),
      )

      jest.spyOn(events, 'safeMsgDispatch')

      const safe = {
        version: '1.3.0',
        chainId: '5',
        address: {
          value: zeroPadValue('0x0789', 20),
        },
      } as unknown as SafeState
      const message: {
        types: { [type: string]: { name: string; type: string }[] }
        domain: any
        message: any
        primaryType: string
      } = {
        types: {
          Test: [{ name: 'test', type: 'string' }],
        },
        domain: {
          chainId: 1,
          name: 'TestDapp',
          verifyingContract: zeroPadValue('0x1234', 20),
        },
        message: {
          test: 'Hello World!',
        },
        primaryType: 'Test',
      }
      const origin = 'http://example.com'

      await dispatchSafeMsgProposal({ provider: MockEip1193Provider, safe, message, origin })

      // Normalize message manually for comparison
      const normalizedMessage = {
        ...message,
        types: {
          ...message.types,
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
        },
      }

      expect(capturedRequest.body).toEqual({
        message: normalizedMessage,
        signature: mockValidSignature,
        origin,
      })
    })

    it('should adjust hardware wallet signatures', async () => {
      jest.spyOn(sdk, 'getAssertedChainSigner').mockResolvedValue({
        signTypedData: jest.fn().mockImplementation(() => Promise.resolve(mockSignatureWithInvalidV)),
      } as unknown as JsonRpcSigner)

      // Mock MSW handler for message creation
      let capturedRequest: any
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/messages`, async ({ request }) => {
          capturedRequest = {
            body: await request.json(),
          }
          return HttpResponse.json({})
        }),
      )

      const safeMsgDispatchSpy = jest.spyOn(events, 'safeMsgDispatch')

      const safe = {
        version: '1.3.0',
        chainId: '5',
        address: {
          value: zeroPadValue('0x0789', 20),
        },
      } as unknown as SafeState
      const message = 'Hello world'
      const origin = 'http://example.com'

      await dispatchSafeMsgProposal({ provider: MockEip1193Provider, safe, message, origin })

      expect(capturedRequest.body).toEqual({
        message,
        // Even though the mock returns the signature with invalid V, the valid signature should get dispatched as we adjust invalid Vs
        signature: mockValidSignature,
        origin,
      })

      expect(safeMsgDispatchSpy).toHaveBeenCalledWith(events.SafeMsgEvent.PROPOSE, {
        messageHash: '0x0123',
      })
    })

    it('should dispatch a message proposal failure', async () => {
      // Mock MSW handler to return error
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/messages`, () => {
          return HttpResponse.json({ message: 'Example error' }, { status: 500 })
        }),
      )

      const safeMsgDispatchSpy = jest.spyOn(events, 'safeMsgDispatch')

      const safe = {
        version: '1.3.0',
        chainId: '5',
        address: {
          value: zeroPadValue('0x0789', 20),
        },
      } as unknown as SafeState
      const message = 'Hello world'
      const origin = 'http://example.com'

      await expect(dispatchSafeMsgProposal({ provider: MockEip1193Provider, safe, message, origin })).rejects.toThrow()

      expect(safeMsgDispatchSpy).toHaveBeenCalledWith(events.SafeMsgEvent.PROPOSE_FAILED, {
        messageHash: '0x0123',
        error: expect.any(Error),
      })
    })
  })

  describe('dispatchSafeMsgConfirmation', () => {
    it('should dispatch a message confirmation', async () => {
      // Mock MSW handler for message signature update
      let capturedRequest: any
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash/signatures`, async ({ request, params }) => {
          capturedRequest = {
            params,
            body: await request.json(),
          }
          return HttpResponse.json({})
        }),
      )

      const safeMsgDispatchSpy = jest.spyOn(events, 'safeMsgDispatch')

      const safe = {
        version: '1.3.0',
        chainId: '5',
        address: {
          value: zeroPadValue('0x0789', 20),
        },
      } as unknown as SafeState
      const message = 'Hello world'

      await dispatchSafeMsgConfirmation({ provider: MockEip1193Provider, safe, message })

      expect(capturedRequest.params.chainId).toBe('5')
      expect(capturedRequest.params.messageHash).toBe('0x0123')
      expect(capturedRequest.body).toEqual({
        signature: mockValidSignature,
      })

      expect(safeMsgDispatchSpy).toHaveBeenCalledWith(events.SafeMsgEvent.CONFIRM_PROPOSE, {
        messageHash: '0x0123',
      })
    })

    it('should dispatch a message confirmation failure', async () => {
      // Mock MSW handler to return error
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash/signatures`, () => {
          return HttpResponse.json({ message: 'Example error' }, { status: 500 })
        }),
      )

      const safeMsgDispatchSpy = jest.spyOn(events, 'safeMsgDispatch')

      const safe = {
        version: '1.3.0',
        chainId: '5',
        address: {
          value: zeroPadValue('0x0789', 20),
        },
      } as unknown as SafeState
      const message = 'Hello world'

      await expect(dispatchSafeMsgConfirmation({ provider: MockEip1193Provider, safe, message })).rejects.toThrow()

      expect(safeMsgDispatchSpy).toHaveBeenCalledWith(events.SafeMsgEvent.CONFIRM_PROPOSE_FAILED, {
        messageHash: '0x0123',
        error: expect.any(Error),
      })
    })
  })
})
