import {
  PROTOCOL_VERSION,
  type BaseMessage,
  type AccountToShellMessage,
  type WalletState,
  isAccountAppMessage,
} from '@safe-global/shell-protocol'

type MessageHandler = (message: BaseMessage<AccountToShellMessage>) => void | Promise<void>

/**
 * Handles postMessage communication with the Account app iframe
 * Listens for requests from the iframe and sends wallet state updates
 */
export class ShellCommunicator {
  private handlers = new Map<string, Set<MessageHandler>>()
  private iframeWindow: Window | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleIncomingMessage)
    }
  }

  /**
   * Set the iframe window reference for sending messages
   */
  setIframeWindow(iframe: Window): void {
    this.iframeWindow = iframe
  }

  /**
   * Handle incoming messages from the account app
   */
  private handleIncomingMessage = (event: MessageEvent): void => {
    const msg = event.data

    // Validate message is from account app
    if (!isAccountAppMessage(msg)) {
      return
    }

    // Check version compatibility
    if (msg.version !== PROTOCOL_VERSION) {
      console.warn(`[Shell] Protocol version mismatch: expected ${PROTOCOL_VERSION}, got ${msg.version}`)
    }

    // Notify registered handlers
    const messageType = msg.payload.type
    const handlers = this.handlers.get(messageType)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(msg)
        } catch (error) {
          console.error(`[Shell] Error handling message ${messageType}:`, error)
        }
      })
    }
  }

  /**
   * Register a handler for a specific message type
   */
  on(messageType: AccountToShellMessage['type'], handler: MessageHandler): () => void {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, new Set())
    }
    this.handlers.get(messageType)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(messageType)?.delete(handler)
    }
  }

  /**
   * Send wallet state update to account app
   */
  sendWalletState(walletState: WalletState): void {
    if (!this.iframeWindow) {
      console.warn('[Shell] Cannot send wallet state: iframe not initialized')
      return
    }

    this.iframeWindow.postMessage(
      {
        source: 'safe-shell',
        version: PROTOCOL_VERSION,
        payload: {
          type: 'WALLET_STATE_CHANGED',
          payload: walletState,
        },
      },
      '*',
    )
  }

  /**
   * Send theme change to account app
   */
  sendThemeChange(mode: 'light' | 'dark'): void {
    if (!this.iframeWindow) {
      console.warn('[Shell] Cannot send theme: iframe not initialized')
      return
    }

    this.iframeWindow.postMessage(
      {
        source: 'safe-shell',
        version: PROTOCOL_VERSION,
        payload: {
          type: 'THEME_CHANGED',
          payload: { mode },
        },
      },
      '*',
    )
  }

  /**
   * Send navigation command to account app
   */
  sendNavigation(path: string, query?: Record<string, string>): void {
    if (!this.iframeWindow) {
      console.warn('[Shell] Cannot send navigation: iframe not initialized')
      return
    }

    this.iframeWindow.postMessage(
      {
        source: 'safe-shell',
        version: PROTOCOL_VERSION,
        payload: {
          type: 'NAVIGATE',
          payload: { path, query },
        },
      },
      '*',
    )
  }

  /**
   * Send response to a request from account app
   */
  sendResponse(requestId: string, data?: unknown, error?: string): void {
    if (!this.iframeWindow) {
      console.warn('[Shell] Cannot send response: iframe not initialized')
      return
    }

    this.iframeWindow.postMessage(
      {
        source: 'safe-shell',
        version: PROTOCOL_VERSION,
        payload: {
          type: 'RESPONSE',
          requestId,
          payload: { data, error },
        },
      },
      '*',
    )
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleIncomingMessage)
    }
    this.handlers.clear()
    this.iframeWindow = null
  }
}

// Singleton instance
let instance: ShellCommunicator | null = null

export function getShellCommunicator(): ShellCommunicator {
  if (!instance) {
    instance = new ShellCommunicator()
  }
  return instance
}
