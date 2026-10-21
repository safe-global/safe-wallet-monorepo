/**
 * A dApp that connects to the Safe over WalletConnect, through the hosted relay, as a real dApp does.
 *
 * It runs in the Playwright process, so a test controls what the dApp sends and reads what it gets back.
 */
import { randomUUID } from 'node:crypto'
import { SignClient } from '@walletconnect/sign-client'
import type { SessionTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'

export const DAPP_NAME = 'Safe E2E dApp'

const METADATA = {
  name: DAPP_NAME,
  description: 'The dApp side of the WalletConnect E2E tests',
  url: 'https://e2e-dapp.safe.test',
  icons: [],
}

const METHODS = ['eth_sendTransaction', 'eth_getTransactionReceipt', 'personal_sign']
// As wagmi and AppKit request them; the Safe emits chainChanged right after it approves the session.
const EVENTS = ['chainChanged', 'accountsChanged']

type SignClientInstance = Awaited<ReturnType<typeof SignClient.init>>

export type RpcError = { code: number; message: string }

/** What the wallet answered to a request: a result, or an error such as 4001 for a rejection. */
export type RpcResponse = { result: unknown } | { error: RpcError }

function isRpcError(value: unknown): value is RpcError {
  return typeof value === 'object' && value !== null && 'code' in value && 'message' in value
}

type EmitCheck = (params: unknown) => Promise<void>

function hasEmitCheck(engine: unknown): engine is { isValidEmit: EmitCheck } {
  return typeof engine === 'object' && engine !== null && 'isValidEmit' in engine
}

/**
 * sign-client (2.21.10 to 2.26.0) does not await its check of an incoming session event, so an event that arrives
 * before the session is stored rejects unhandled and fails the test. A handler on that check drops such an event.
 */
function handleEarlySessionEvents(client: SignClientInstance): void {
  const engine: unknown = client.engine
  if (!hasEmitCheck(engine)) throw new Error('sign-client has no engine.isValidEmit; remove handleEarlySessionEvents')
  const check = engine.isValidEmit.bind(engine)
  engine.isValidEmit = (params) => {
    const result = check(params)
    result.catch(() => undefined)
    return result
  }
}

function projectId(): string {
  const id = process.env.NEXT_PUBLIC_WC_PROJECT_ID
  if (!id) throw new Error('NEXT_PUBLIC_WC_PROJECT_ID is not set; the dApp needs it to reach the WalletConnect relay')
  return id
}

export class WalletConnectDapp {
  /** Each request and response, one per line, for the test report. */
  readonly log: string[] = []
  private session: SessionTypes.Struct | undefined
  private approval: (() => Promise<SessionTypes.Struct>) | undefined
  private deleted: Promise<void> | undefined

  private constructor(
    private readonly client: SignClientInstance,
    private readonly chain: string,
  ) {}

  /** Starts a dApp client for `chainId`; it keeps its keys in memory only. */
  static async start(chainId: string): Promise<WalletConnectDapp> {
    const client = await SignClient.init({
      projectId: projectId(),
      metadata: METADATA,
      storageOptions: { database: ':memory:' },
      // The SDK shares one core per prefix in a process; a closed dApp's core must not serve the next one.
      customStoragePrefix: randomUUID(),
      logger: 'error',
    })
    handleEarlySessionEvents(client)
    return new WalletConnectDapp(client, `eip155:${chainId}`)
  }

  /** Proposes a session; returns the pairing URI that the user pastes into the wallet. */
  async connect(): Promise<string> {
    const { uri, approval } = await this.client.connect({
      optionalNamespaces: { eip155: { chains: [this.chain], methods: METHODS, events: EVENTS } },
    })
    if (!uri) throw new Error('WalletConnect returned no pairing URI')
    this.approval = approval
    return uri
  }

  /** Resolves with the session once the wallet approves the proposal. */
  async waitForSession(): Promise<SessionTypes.Struct> {
    if (!this.approval) throw new Error('Call connect() before waitForSession()')
    const session = await this.approval()
    this.session = session
    this.deleted = new Promise((resolve) => {
      this.client.on('session_delete', ({ topic }) => {
        if (topic === session.topic) resolve()
      })
    })
    this.log.push(`session ${JSON.stringify(session.namespaces)}`)
    return session
  }

  /** The accounts that the approved session gives the dApp, as `eip155:<chain>:<address>`. */
  get accounts(): string[] {
    return this.session?.namespaces.eip155?.accounts ?? []
  }

  /** Sends a request in the session and waits for the wallet's answer. */
  async request(method: string, params: unknown[]): Promise<RpcResponse> {
    if (!this.session) throw new Error(`No session for ${method}; wait for the session first`)
    this.log.push(`request ${method} ${JSON.stringify(params)}`)
    let response: RpcResponse
    try {
      const result = await this.client.request({
        topic: this.session.topic,
        chainId: this.chain,
        request: { method, params },
      })
      response = { result }
    } catch (error) {
      if (!isRpcError(error)) throw error
      response = { error: { code: error.code, message: error.message } }
    }
    this.log.push(`response ${method} ${JSON.stringify(response)}`)
    return response
  }

  /** Resolves when the wallet ends the session. */
  waitForSessionDelete(): Promise<void> {
    if (!this.deleted) throw new Error('No session to wait for; wait for the session first')
    return this.deleted
  }

  /** Ends the session if it is still open and closes the relay connection. */
  async close(): Promise<void> {
    const topic = this.session?.topic
    if (topic && this.client.session.keys.includes(topic)) {
      await this.client.disconnect({ topic, reason: getSdkError('USER_DISCONNECTED') })
    }
    await this.client.core.relayer.transportClose()
  }
}
