import {
  PROTOCOL_VERSION,
  type BaseMessage,
  type ShellToAccountMessage,
  type WalletState,
  isShellMessage,
} from '@safe-global/shell-protocol'

type MessageHandler = (message: BaseMessage<ShellToAccountMessage>) => void | Promise<void>

/**
 * Handles postMessage communication with the parent Shell app
 * Used when the Account app is running inside an iframe
 */
export class ShellCommunicator {
  private handlers = new Map<string, Set<MessageHandler>>()
  private pendingRequests = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>()
  private isInitialized = false

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleIncomingMessage)
    }
  }

  /**
   * Initialize the communicator and signal readiness to shell
   */
  initialize(appVersion: string): void {
    if (this.isInitialized) return

    if (typeof window !== 'undefined' && window !== window.parent) {
      window.parent.postMessage(
        {
          source: 'safe-account-app',
          version: PROTOCOL_VERSION,
          type: 'APP_READY',
          payload: { version: appVersion },
        },
        '*',
      )
    }

    this.isInitialized = true
  }

  /**
   * Handle incoming messages from the shell
   */
  private handleIncomingMessage = (event: MessageEvent): void => {
    const msg = event.data

    // Validate message is from shell
    if (!isShellMessage(msg)) {
      return
    }

    // Check version compatibility
    if (msg.version !== PROTOCOL_VERSION) {
      console.warn(`Protocol version mismatch: expected ${PROTOCOL_VERSION}, got ${msg.version}`)
    }

    // Handle responses to our requests
    if (msg.payload.type === 'RESPONSE' && 'requestId' in msg.payload) {
      const requestId = msg.payload.requestId
      const pending = this.pendingRequests.get(requestId)

      if (pending) {
        const response = msg.payload.payload
        if (response.error) {
          pending.reject(new Error(response.error))
        } else {
          pending.resolve(response.data)
        }
        this.pendingRequests.delete(requestId)
      }
      return
    }

    // Notify registered handlers
    const messageType = msg.payload.type
    const handlers = this.handlers.get(messageType)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(msg)
        } catch (error) {
          console.error('Error handling message:', messageType, error)
        }
      })
    }
  }

  /**
   * Register a handler for a specific message type
   */
  on(messageType: ShellToAccountMessage['type'], handler: MessageHandler): () => void {
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
   * Request wallet state from shell
   */
  async requestWalletState(): Promise<WalletState> {
    return this.sendRequest('REQUEST_WALLET_STATE', {})
  }

  /**
   * Request wallet connection from shell
   */
  async requestConnect(): Promise<void> {
    return this.sendRequest('REQUEST_CONNECT_WALLET', {})
  }

  /**
   * Request wallet disconnection from shell
   */
  async requestDisconnect(): Promise<void> {
    return this.sendRequest('REQUEST_DISCONNECT_WALLET', {})
  }

  /**
   * Request chain switch from shell
   */
  async requestSwitchChain(chainId: string): Promise<void> {
    return this.sendRequest('REQUEST_SWITCH_CHAIN', { chainId })
  }

  /**
   * Send RPC request to shell's wallet provider
   */
  async sendRpcRequest(method: string, params: unknown[]): Promise<unknown> {
    return this.sendRequest('RPC_REQUEST', { method, params })
  }

  /**
   * Notify shell of navigation changes
   */
  notifyNavigationChange(path: string, query?: Record<string, string>): void {
    if (typeof window === 'undefined' || window === window.parent) {
      console.warn('Cannot send message: not running in iframe')
      return
    }

    window.parent.postMessage(
      {
        source: 'safe-account-app',
        version: PROTOCOL_VERSION,
        type: 'NAVIGATION_CHANGED',
        payload: { path, query },
      },
      '*',
    )
  }

  /**
   * Send a request and wait for response
   */
  private async sendRequest<T>(
    type: 'REQUEST_WALLET_STATE' | 'REQUEST_CONNECT_WALLET' | 'REQUEST_DISCONNECT_WALLET',
    payload: unknown,
  ): Promise<T>
  private async sendRequest<T>(type: 'REQUEST_SWITCH_CHAIN', payload: { chainId: string }): Promise<T>
  private async sendRequest<T>(type: 'RPC_REQUEST', payload: { method: string; params: unknown[] }): Promise<T>
  private async sendRequest<T>(type: string, payload: unknown): Promise<T> {
    const requestId = crypto.randomUUID()

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || window === window.parent) {
        reject(new Error('Cannot send message: not running in iframe'))
        return
      }

      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`Request timeout: ${type}`))
      }, 30000)

      // Store promise handlers
      this.pendingRequests.set(requestId, {
        resolve: (value) => {
          clearTimeout(timeout)
          resolve(value as T)
        },
        reject: (error) => {
          clearTimeout(timeout)
          reject(error)
        },
      })

      // Send request directly
      window.parent.postMessage(
        {
          source: 'safe-account-app',
          version: PROTOCOL_VERSION,
          type,
          requestId,
          payload,
        },
        '*',
      )
    })
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleIncomingMessage)
    }
    this.handlers.clear()
    this.pendingRequests.clear()
    this.isInitialized = false
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
