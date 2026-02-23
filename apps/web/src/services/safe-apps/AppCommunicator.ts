import type { RefObject } from 'react'
import type { SDKMessageEvent, MethodToResponse, ErrorResponse, RequestId } from '@safe-global/safe-apps-sdk'
import { getSDKVersion, Methods, MessageFormatter } from '@safe-global/safe-apps-sdk'
import { asError } from '@safe-global/utils/services/exceptions/utils'

type MessageHandler = (
  msg: SDKMessageEvent,
) => void | MethodToResponse[Methods] | ErrorResponse | Promise<MethodToResponse[Methods] | ErrorResponse | void>

type AppCommunicatorConfig = {
  onMessage?: (msg: SDKMessageEvent) => void
  onError?: (error: Error, data: any) => void
}

class AppCommunicator {
  private iframeRef: RefObject<HTMLIFrameElement | null>
  private handlers = new Map<Methods, MessageHandler>()
  private config: AppCommunicatorConfig

  constructor(iframeRef: RefObject<HTMLIFrameElement | null>, config?: AppCommunicatorConfig) {
    this.iframeRef = iframeRef
    this.config = config || {}

    window.addEventListener('message', this.handleIncomingMessage)
  }

  on = (method: Methods, handler: MessageHandler): void => {
    this.handlers.set(method, handler)
  }

  private isValidMessage = (msg: SDKMessageEvent): boolean => {
    if (!msg.data) return false
    if (msg.data.hasOwnProperty('isCookieEnabled')) {
      return true
    }

    const sentFromIframe = this.iframeRef.current?.contentWindow === msg.source
    const knownMethod = Object.values(Methods).includes(msg.data.method)

    // TODO: move it to safe-app Methods types
    const isThemeInfoMethod = (msg.data.method as string) === 'getCurrentTheme'

    return sentFromIframe && (knownMethod || isThemeInfoMethod)
  }

  private canHandleMessage = (msg: SDKMessageEvent): boolean => {
    if (!msg.data) return false

    return Boolean(this.handlers.get(msg.data.method))
  }

  send = (data: unknown, requestId: RequestId, error = false): void => {
    const sdkVersion = getSDKVersion()
    const msg = error
      ? MessageFormatter.makeErrorResponse(requestId, data as string, sdkVersion)
      : MessageFormatter.makeResponse(requestId, data, sdkVersion)

    this.iframeRef.current?.contentWindow?.postMessage(msg, '*')
  }

  handleIncomingMessage = async (msg: SDKMessageEvent): Promise<void> => {
    const validMessage = this.isValidMessage(msg)
    const hasHandler = this.canHandleMessage(msg)

    if (validMessage && hasHandler) {
      const handler = this.handlers.get(msg.data.method)

      this.config?.onMessage?.(msg)

      try {
        // @ts-expect-error Handler existence is checked in this.canHandleMessage
        const response = await handler(msg)

        // If response is not returned, it means the response will be send somewhere else
        if (typeof response !== 'undefined') {
          this.send(response, msg.data.id)
        }
      } catch (e) {
        const error = asError(e)

        this.send(error.message, msg.data.id, true)
        this.config?.onError?.(error, msg.data)
      }
    }
  }

  clear = (): void => {
    window.removeEventListener('message', this.handleIncomingMessage)
    this.handlers.clear()
  }
}

export default AppCommunicator
