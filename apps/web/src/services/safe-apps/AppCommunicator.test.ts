import { Methods } from '@safe-global/safe-apps-sdk'
import type { SDKMessageEvent } from '@safe-global/safe-apps-sdk'
import type { RefObject } from 'react'
import AppCommunicator from './AppCommunicator'

const ALLOWED_ORIGIN = 'https://safe-app.example.com'

const createMockIframeRef = () => {
  const mockContentWindow = {
    postMessage: jest.fn(),
  } as unknown as Window

  return {
    current: {
      contentWindow: mockContentWindow,
    },
  } as unknown as RefObject<HTMLIFrameElement>
}

const createSDKMessage = (
  overrides: {
    origin?: string
    source?: Window | null
    method?: Methods | string
    id?: string
  } = {},
  iframeRef?: RefObject<HTMLIFrameElement>,
): SDKMessageEvent => {
  return {
    origin: overrides.origin ?? ALLOWED_ORIGIN,
    source: overrides.source ?? iframeRef?.current?.contentWindow ?? null,
    data: {
      id: overrides.id ?? 'req-1',
      method: overrides.method ?? Methods.getSafeInfo,
      params: {},
      env: { sdkVersion: '1.0.0' },
    },
  } as SDKMessageEvent
}

describe('AppCommunicator', () => {
  let iframeRef: RefObject<HTMLIFrameElement>

  beforeEach(() => {
    iframeRef = createMockIframeRef()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('send', () => {
    it('should use allowedOrigin instead of wildcard', () => {
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)

      communicator.send({ test: true }, 'req-1')

      expect(iframeRef.current?.contentWindow?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'req-1', success: true }),
        ALLOWED_ORIGIN,
      )

      communicator.clear()
    })

    it('should send error responses to allowedOrigin', () => {
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)

      communicator.send('Something went wrong', 'req-2', true)

      expect(iframeRef.current?.contentWindow?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'req-2', success: false }),
        ALLOWED_ORIGIN,
      )

      communicator.clear()
    })

    it('should never use wildcard origin', () => {
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)

      communicator.send({ data: 'sensitive' }, 'req-3')

      const [, targetOrigin] = (iframeRef.current?.contentWindow?.postMessage as jest.Mock).mock.calls[0]
      expect(targetOrigin).not.toBe('*')
      expect(targetOrigin).toBe(ALLOWED_ORIGIN)

      communicator.clear()
    })
  })

  describe('incoming message validation', () => {
    it('should accept messages from the allowed origin and iframe source', async () => {
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)
      const handler = jest.fn().mockReturnValue({ info: 'safe-info' })
      communicator.on(Methods.getSafeInfo, handler)

      const msg = createSDKMessage({}, iframeRef)
      await communicator.handleIncomingMessage(msg)

      expect(handler).toHaveBeenCalled()
      communicator.clear()
    })

    it('should reject messages from a different origin', async () => {
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)
      const handler = jest.fn().mockReturnValue({ info: 'safe-info' })
      communicator.on(Methods.getSafeInfo, handler)

      const msg = createSDKMessage({ origin: 'https://evil.com' }, iframeRef)
      await communicator.handleIncomingMessage(msg)

      expect(handler).not.toHaveBeenCalled()
      communicator.clear()
    })

    it('should reject messages from correct origin but wrong source', async () => {
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)
      const handler = jest.fn().mockReturnValue({ info: 'safe-info' })
      communicator.on(Methods.getSafeInfo, handler)

      const differentWindow = {} as Window
      const msg = createSDKMessage({ source: differentWindow }, iframeRef)
      await communicator.handleIncomingMessage(msg)

      expect(handler).not.toHaveBeenCalled()
      communicator.clear()
    })

    it('should reject messages where iframe navigated to malicious origin', async () => {
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)
      const handler = jest.fn().mockReturnValue({ balances: [] })
      communicator.on(Methods.getSafeBalances, handler)

      // Simulate: iframe navigated away, attacker sends message from the same
      // contentWindow but with a different origin
      const msg = createSDKMessage(
        {
          origin: 'https://attacker.com',
          method: Methods.getSafeBalances,
        },
        iframeRef,
      )
      await communicator.handleIncomingMessage(msg)

      expect(handler).not.toHaveBeenCalled()
      // Ensure no response was sent to the attacker
      expect(iframeRef.current?.contentWindow?.postMessage).not.toHaveBeenCalled()

      communicator.clear()
    })

    it('should reject messages with isCookieEnabled from a different origin', async () => {
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)
      const handler = jest.fn().mockReturnValue({ info: 'safe-info' })
      communicator.on(Methods.getSafeInfo, handler)

      const msg = createSDKMessage({ origin: 'https://evil.com', source: {} as Window }, iframeRef)
      ;(msg.data as Record<string, unknown>).isCookieEnabled = true
      await communicator.handleIncomingMessage(msg)

      expect(handler).not.toHaveBeenCalled()
      communicator.clear()
    })

    it('should reject messages with isCookieEnabled from wrong source window', async () => {
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)
      const handler = jest.fn().mockReturnValue({ info: 'safe-info' })
      communicator.on(Methods.getSafeInfo, handler)

      const msg = createSDKMessage({ source: {} as Window }, iframeRef)
      ;(msg.data as Record<string, unknown>).isCookieEnabled = true
      await communicator.handleIncomingMessage(msg)

      expect(handler).not.toHaveBeenCalled()
      communicator.clear()
    })
  })

  describe('handler responses', () => {
    it('should send handler response to allowedOrigin', async () => {
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)
      const handler = jest.fn().mockReturnValue({ owners: ['0x123'] })
      communicator.on(Methods.getSafeInfo, handler)

      const msg = createSDKMessage({}, iframeRef)
      await communicator.handleIncomingMessage(msg)

      expect(iframeRef.current?.contentWindow?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'req-1', success: true }),
        ALLOWED_ORIGIN,
      )

      communicator.clear()
    })

    it('should send error response to allowedOrigin when handler throws', async () => {
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)
      const handler = jest.fn().mockRejectedValue(new Error('handler failed'))
      communicator.on(Methods.getSafeInfo, handler)

      const msg = createSDKMessage({}, iframeRef)
      await communicator.handleIncomingMessage(msg)

      expect(iframeRef.current?.contentWindow?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'req-1', success: false }),
        ALLOWED_ORIGIN,
      )

      communicator.clear()
    })

    it('should send a generic error message instead of raw error details', async () => {
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)
      const handler = jest.fn().mockRejectedValue(new Error('Internal: secret path /home/user/.config leaked'))
      communicator.on(Methods.getSafeInfo, handler)

      const msg = createSDKMessage({}, iframeRef)
      await communicator.handleIncomingMessage(msg)

      const [sentMessage] = (iframeRef.current?.contentWindow?.postMessage as jest.Mock).mock.calls[0]
      expect(sentMessage.error).not.toContain('secret')
      expect(sentMessage.error).not.toContain('/home/user')
      expect(sentMessage.error).toBe('Request failed')

      communicator.clear()
    })
  })

  describe('clear', () => {
    it('should remove event listener and clear handlers', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const communicator = new AppCommunicator(iframeRef, ALLOWED_ORIGIN)

      communicator.clear()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', communicator.handleIncomingMessage)
    })
  })
})
