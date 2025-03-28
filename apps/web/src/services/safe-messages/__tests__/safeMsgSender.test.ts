import { MockEip1193Provider } from '@/tests/mocks/providers'
import * as gateway from '@safe-global/safe-gateway-typescript-sdk'
import type { JsonRpcSigner } from 'ethers'
import { zeroPadBytes } from 'ethers'

import { dispatchSafeMsgConfirmation, dispatchSafeMsgProposal } from '@/services/safe-messages/safeMsgSender'
import * as utils from '@/utils/safe-messages'
import * as events from '@/services/safe-messages/safeMsgEvents'
import * as sdk from '@/services/tx/tx-sender/sdk'
import { zeroPadValue } from 'ethers'

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  ...jest.requireActual('@safe-global/safe-gateway-typescript-sdk'),
  proposeSafeMessage: jest.fn(),
  confirmSafeMessage: jest.fn(),
}))

const mockValidSignature = `${zeroPadBytes('0x0456', 64)}1c`
const mockSignatureWithInvalidV = `${zeroPadBytes('0x0456', 64)}01`
describe('safeMsgSender', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(utils, 'generateSafeMessageHash').mockImplementation(() => '0x0123')

    jest.spyOn(sdk, 'getAssertedChainSigner').mockResolvedValue({
      signTypedData: jest.fn().mockImplementation(() => Promise.resolve(mockValidSignature)),
    } as unknown as JsonRpcSigner)
  })

  describe('dispatchSafeMsgProposal', () => {
    it('should dispatch a message proposal', async () => {
      const proposeSafeMessageSpy = jest.spyOn(gateway, 'proposeSafeMessage')
      proposeSafeMessageSpy.mockImplementation(() => Promise.resolve())

      const safeMsgDispatchSpy = jest.spyOn(events, 'safeMsgDispatch')

      const safe = {
        version: '1.3.0',
        chainId: '5',
        address: {
          value: zeroPadValue('0x0789', 20),
        },
      } as unknown as gateway.SafeInfo
      const message = 'Hello world'
      const origin = 'http://example.com'

      await dispatchSafeMsgProposal({ provider: MockEip1193Provider, safe, message, origin })

      expect(proposeSafeMessageSpy).toHaveBeenCalledWith('5', zeroPadValue('0x0789', 20), {
        message,
        signature: mockValidSignature,
        origin,
      })

      expect(safeMsgDispatchSpy).toHaveBeenCalledWith(events.SafeMsgEvent.PROPOSE, {
        messageHash: '0x0123',
      })
    })

    it('should normalize EIP712 messages', async () => {
      const proposeSafeMessageSpy = jest.spyOn(gateway, 'proposeSafeMessage')
      proposeSafeMessageSpy.mockImplementation(() => Promise.resolve())
      jest.spyOn(events, 'safeMsgDispatch')

      const safe = {
        version: '1.3.0',
        chainId: '5',
        address: {
          value: zeroPadValue('0x0789', 20),
        },
      } as unknown as gateway.SafeInfo
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

      // Normalize message manually
      message.types['EIP712Domain'] = [
        { name: 'name', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ]
      message.primaryType = 'Test'

      expect(proposeSafeMessageSpy).toHaveBeenCalledWith('5', zeroPadValue('0x0789', 20), {
        message,
        signature: mockValidSignature,
        origin,
      })
    })

    it('should adjust hardware wallet signatures', async () => {
      jest.spyOn(sdk, 'getAssertedChainSigner').mockResolvedValue({
        signTypedData: jest.fn().mockImplementation(() => Promise.resolve(mockSignatureWithInvalidV)),
      } as unknown as JsonRpcSigner)

      const proposeSafeMessageSpy = jest.spyOn(gateway, 'proposeSafeMessage')
      proposeSafeMessageSpy.mockImplementation(() => Promise.resolve())

      const safeMsgDispatchSpy = jest.spyOn(events, 'safeMsgDispatch')

      const safe = {
        version: '1.3.0',
        chainId: '5',
        address: {
          value: zeroPadValue('0x0789', 20),
        },
      } as unknown as gateway.SafeInfo
      const message = 'Hello world'
      const origin = 'http://example.com'

      await dispatchSafeMsgProposal({ provider: MockEip1193Provider, safe, message, origin })

      expect(proposeSafeMessageSpy).toHaveBeenCalledWith('5', zeroPadValue('0x0789', 20), {
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
      const proposeSafeMessageSpy = jest.spyOn(gateway, 'proposeSafeMessage')
      proposeSafeMessageSpy.mockImplementation(() => Promise.reject(new Error('Example error')))

      const safeMsgDispatchSpy = jest.spyOn(events, 'safeMsgDispatch')

      const safe = {
        version: '1.3.0',
        chainId: '5',
        address: {
          value: zeroPadValue('0x0789', 20),
        },
      } as unknown as gateway.SafeInfo
      const message = 'Hello world'
      const origin = 'http://example.com'

      try {
        await dispatchSafeMsgProposal({ provider: MockEip1193Provider, safe, message, origin })
      } catch (e) {
        expect((e as Error).message).toBe('Example error')

        expect(proposeSafeMessageSpy).toHaveBeenCalledWith('5', zeroPadValue('0x0789', 20), {
          message,
          signature: mockValidSignature,
          origin,
        })

        expect(safeMsgDispatchSpy).toHaveBeenCalledWith(events.SafeMsgEvent.PROPOSE_FAILED, {
          messageHash: '0x0123',
          error: expect.any(Error),
        })
      }
    })
  })

  describe('dispatchSafeMsgConfirmation', () => {
    it('should dispatch a message proposal', async () => {
      const confirmSafeMessageSpy = jest.spyOn(gateway, 'confirmSafeMessage')
      confirmSafeMessageSpy.mockImplementation(() => Promise.resolve())

      const safeMsgDispatchSpy = jest.spyOn(events, 'safeMsgDispatch')

      const safe = {
        version: '1.3.0',
        chainId: '5',
        address: {
          value: zeroPadValue('0x0789', 20),
        },
      } as unknown as gateway.SafeInfo
      const message = 'Hello world'

      await dispatchSafeMsgConfirmation({ provider: MockEip1193Provider, safe, message })

      expect(confirmSafeMessageSpy).toHaveBeenCalledWith('5', '0x0123', {
        signature: mockValidSignature,
      })

      expect(safeMsgDispatchSpy).toHaveBeenCalledWith(events.SafeMsgEvent.CONFIRM_PROPOSE, {
        messageHash: '0x0123',
      })
    })

    it('should dispatch a message proposal failure', async () => {
      const confirmSafeMessageSpy = jest.spyOn(gateway, 'confirmSafeMessage')
      confirmSafeMessageSpy.mockImplementation(() => Promise.reject(new Error('Example error')))

      const safeMsgDispatchSpy = jest.spyOn(events, 'safeMsgDispatch')

      const safe = {
        version: '1.3.0',
        chainId: '5',
        address: {
          value: zeroPadValue('0x0789', 20),
        },
      } as unknown as gateway.SafeInfo
      const message = 'Hello world'

      try {
        await dispatchSafeMsgConfirmation({ provider: MockEip1193Provider, safe, message })
      } catch (e) {
        expect((e as Error).message).toBe('Example error')

        expect(confirmSafeMessageSpy).toHaveBeenCalledWith('5', '0x0123', {
          signature: mockValidSignature,
        })

        expect(safeMsgDispatchSpy).toHaveBeenCalledWith(events.SafeMsgEvent.CONFIRM_PROPOSE_FAILED, {
          messageHash: '0x0123',
          error: expect.any(Error),
        })
      }
    })
  })
})
