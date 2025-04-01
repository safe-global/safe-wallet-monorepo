import { Core } from '@walletconnect/core'
import { WalletKit, type WalletKitTypes } from '@reown/walletkit'
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils'
import type Web3WalletType from '@reown/walletkit'
import type { ProposalTypes, SessionTypes } from '@walletconnect/types'
import { type JsonRpcResponse } from '@walletconnect/jsonrpc-utils'
import uniq from 'lodash/uniq'

import { IS_PRODUCTION, LS_NAMESPACE, WC_PROJECT_ID } from '@/config/constants'
import { EIP155, SAFE_COMPATIBLE_EVENTS, SAFE_COMPATIBLE_METHODS, SAFE_WALLET_METADATA } from '../constants'
import { getEip155ChainId, stripEip155Prefix } from './utils'
import { invariant } from '@safe-global/utils/utils/helpers'

const SESSION_ADD_EVENT = 'session_add' as WalletKitTypes.Event // Workaround: WalletConnect doesn't emit session_add event
const SESSION_REJECT_EVENT = 'session_reject' as WalletKitTypes.Event // Workaround: WalletConnect doesn't emit session_reject event

function assertWeb3Wallet<T extends Web3WalletType | null>(web3Wallet: T): asserts web3Wallet {
  return invariant(web3Wallet, 'WalletConnect not initialized')
}

/**
 * An abstraction over the WalletConnect SDK to simplify event subscriptions
 * and add workarounds for dapps requesting wrong required chains.
 * Should be kept stateless exept for the web3Wallet instance.
 */
class WalletConnectWallet {
  private web3Wallet: Web3WalletType | null = null

  /**
   * Initialize WalletConnect wallet SDK
   */
  public async init() {
    if (this.web3Wallet) return

    const core = new Core({
      projectId: WC_PROJECT_ID,
      logger: IS_PRODUCTION ? undefined : 'debug',
      customStoragePrefix: LS_NAMESPACE,
    })

    const web3wallet = await WalletKit.init({
      core,
      metadata: SAFE_WALLET_METADATA,
    })

    this.web3Wallet = web3wallet
  }

  /**
   * Connect using a wc-URI
   */
  public async connect(uri: string) {
    assertWeb3Wallet(this.web3Wallet)
    return this.web3Wallet.core.pairing.pair({ uri })
  }

  public async chainChanged(topic: string, chainId: string) {
    const eipChainId = getEip155ChainId(chainId)

    return this.web3Wallet?.emitSessionEvent({
      topic,
      event: {
        name: 'chainChanged',
        data: Number(chainId),
      },
      chainId: eipChainId,
    })
  }

  public async accountsChanged(topic: string, chainId: string, address: string) {
    const eipChainId = getEip155ChainId(chainId)

    return this.web3Wallet?.emitSessionEvent({
      topic,
      event: {
        name: 'accountsChanged',
        data: [address],
      },
      chainId: eipChainId,
    })
  }

  private getNamespaces(proposal: WalletKitTypes.SessionProposal, currentChainId: string, safeAddress: string) {
    // As workaround, we pretend to support all the required chains plus the current Safe's chain
    const requiredChains = proposal.params.requiredNamespaces[EIP155]?.chains || []

    const supportedChainIds = [currentChainId].concat(requiredChains.map(stripEip155Prefix))

    const eip155ChainIds = supportedChainIds.map(getEip155ChainId)
    const eip155Accounts = eip155ChainIds.map((eip155ChainId) => `${eip155ChainId}:${safeAddress}`)

    // Don't include optionalNamespaces methods/events
    const methods = uniq((proposal.params.requiredNamespaces[EIP155]?.methods || []).concat(SAFE_COMPATIBLE_METHODS))
    const events = uniq((proposal.params.requiredNamespaces[EIP155]?.events || []).concat(SAFE_COMPATIBLE_EVENTS))

    return buildApprovedNamespaces({
      proposal: proposal.params,
      supportedNamespaces: {
        [EIP155]: {
          chains: eip155ChainIds,
          accounts: eip155Accounts,
          methods,
          events,
        },
      },
    })
  }

  public async approveSession(
    proposal: WalletKitTypes.SessionProposal,
    currentChainId: string,
    safeAddress: string,
    sessionProperties?: ProposalTypes.SessionProperties,
  ) {
    assertWeb3Wallet(this.web3Wallet)

    const namespaces = this.getNamespaces(proposal, currentChainId, safeAddress)

    // Approve the session proposal
    const session = await this.web3Wallet.approveSession({
      id: proposal.id,
      namespaces,
      sessionProperties,
    })

    await this.chainChanged(session.topic, currentChainId)

    // Workaround: WalletConnect doesn't have a session_add event
    // and we want to update our state inside the useWalletConnectSessions hook
    this.web3Wallet?.events.emit(SESSION_ADD_EVENT, session)

    // Return updated session as it may have changed
    return this.getActiveSessions().find(({ topic }) => topic === session.topic) ?? session
  }

  private async updateSession(session: SessionTypes.Struct, chainId: string, safeAddress: string) {
    assertWeb3Wallet(this.web3Wallet)

    const currentEip155ChainIds = session.namespaces[EIP155]?.chains || []
    const currentEip155Accounts = session.namespaces[EIP155]?.accounts || []

    const newEip155ChainId = getEip155ChainId(chainId)
    const newEip155Account = `${newEip155ChainId}:${safeAddress}`

    const isUnsupportedChain = !currentEip155ChainIds.includes(newEip155ChainId)
    const isNewSessionSafe = !currentEip155Accounts.includes(newEip155Account)

    // Switching to unsupported chain
    if (isUnsupportedChain) {
      return this.disconnectSession(session)
    }

    // Add new Safe to the session namespace
    if (isNewSessionSafe) {
      const namespaces: SessionTypes.Namespaces = {
        [EIP155]: {
          ...session.namespaces[EIP155],
          chains: currentEip155ChainIds,
          accounts: [newEip155Account, ...currentEip155Accounts],
        },
      }

      await this.web3Wallet.updateSession({
        topic: session.topic,
        namespaces,
      })
    }

    // Switch to the new chain
    await this.chainChanged(session.topic, chainId)

    // Switch to the new Safe
    await this.accountsChanged(session.topic, chainId, safeAddress)
  }

  public async updateSessions(chainId: string, safeAddress: string) {
    // If updating sessions disconnects multiple due to an unsupported chain,
    // we need to wait for the previous session to disconnect before the next
    for await (const session of this.getActiveSessions()) {
      await this.updateSession(session, chainId, safeAddress)
    }
  }

  public async rejectSession(proposal: WalletKitTypes.SessionProposal) {
    assertWeb3Wallet(this.web3Wallet)

    await this.web3Wallet.rejectSession({
      id: proposal.id,
      reason: getSdkError('USER_REJECTED'),
    })

    // Workaround: WalletConnect doesn't have a session_reject event
    this.web3Wallet?.events.emit(SESSION_REJECT_EVENT, proposal)
  }

  /**
   * Subscribe to session proposals
   */
  public onSessionPropose(handler: (e: WalletKitTypes.SessionProposal) => void) {
    // Subscribe to the session proposal event
    this.web3Wallet?.on('session_proposal', handler)

    // Return the unsubscribe function
    return () => {
      this.web3Wallet?.off('session_proposal', handler)
    }
  }

  /**
   * Subscribe to session proposal rejections
   */
  public onSessionReject(handler: (e: WalletKitTypes.SessionProposal) => void) {
    // @ts-expect-error - custom event payload
    this.web3Wallet?.on(SESSION_REJECT_EVENT, handler)

    return () => {
      // @ts-expect-error
      this.web3Wallet?.off(SESSION_REJECT_EVENT, handler)
    }
  }

  /**
   * Subscribe to session add
   */
  public onSessionAdd = (handler: (e: SessionTypes.Struct) => void) => {
    // @ts-expect-error - custom event payload
    this.web3Wallet?.on(SESSION_ADD_EVENT, handler)

    return () => {
      // @ts-expect-error
      this.web3Wallet?.off(SESSION_ADD_EVENT, handler)
    }
  }

  /**
   * Subscribe to session delete
   */
  public onSessionDelete = (handler: (session: SessionTypes.Struct) => void) => {
    // @ts-expect-error - custom event payload
    this.web3Wallet?.on('session_delete', handler)

    return () => {
      // @ts-expect-error
      this.web3Wallet?.off('session_delete', handler)
    }
  }

  /**
   * Disconnect a session
   */
  public async disconnectSession(session: SessionTypes.Struct) {
    assertWeb3Wallet(this.web3Wallet)

    await this.web3Wallet.disconnectSession({
      topic: session.topic,
      reason: getSdkError('USER_DISCONNECTED'),
    })

    // Workaround: WalletConnect doesn't emit session_delete event when disconnecting from the wallet side
    // and we want to update the state inside the useWalletConnectSessions hook
    this.web3Wallet.events.emit('session_delete', session)
  }

  /**
   * Get active sessions
   */
  public getActiveSessions(): SessionTypes.Struct[] {
    const sessionsMap = this.web3Wallet?.getActiveSessions() || {}
    return Object.values(sessionsMap)
  }

  /**
   * Subscribe to requests
   */
  public onRequest(handler: (event: WalletKitTypes.SessionRequest) => void) {
    this.web3Wallet?.on('session_request', handler)

    return () => {
      this.web3Wallet?.off('session_request', handler)
    }
  }

  /**
   * Send a response to a request
   */
  public async sendSessionResponse(topic: string, response: JsonRpcResponse<unknown>) {
    assertWeb3Wallet(this.web3Wallet)

    return await this.web3Wallet.respondSessionRequest({ topic, response })
  }
}

export default WalletConnectWallet
