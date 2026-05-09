import { toBeHex } from 'ethers'
import type { ProposalTypes, SessionTypes, SignClientTypes, Verify } from '@walletconnect/types'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'

import WalletConnectWallet from '../WalletConnectWallet'

jest.mock('@walletconnect/core', () => ({
  Core: jest.fn(),
}))

jest.mock('@reown/walletkit', () => {
  class MockWeb3Wallet implements Partial<IWalletKit> {
    static init() {
      const wallet = new MockWeb3Wallet()

      return Promise.resolve(wallet)
    }

    core = {
      pairing: {
        pair: jest.fn(),
      },
    } as unknown as IWalletKit['core']

    approveSession = jest.fn()
    updateSession = jest.fn()
    disconnectSession = jest.fn()

    getActiveSessions = jest.fn()

    respondSessionRequest = jest.fn()

    events = {
      emit: jest.fn(),
    } as unknown as IWalletKit['events']
    on = jest.fn()
    off = jest.fn()

    emitSessionEvent = jest.fn()
  }

  return {
    WalletKit: MockWeb3Wallet,
  }
})

describe('WalletConnectWallet', () => {
  let wallet: WalletConnectWallet

  beforeEach(async () => {
    wallet = new WalletConnectWallet()

    await wallet.init()
  })

  afterEach(() => {
    // Reset instance to avoid side leaking mocks
    jest.resetModules()
  })

  describe('connect', () => {
    it('should call pair with the correct parameters', async () => {
      const pairSpy = jest.spyOn(((wallet as any).web3Wallet as IWalletKit).core.pairing, 'pair')

      await wallet.connect('wc:123')

      expect(pairSpy).toHaveBeenCalledWith({ uri: 'wc:123' })
    })
  })

  describe('chainChanged', () => {
    it('should call emitSessionEvent with the correct parameters', async () => {
      const emitSessionEventSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'emitSessionEvent')

      await wallet.chainChanged('topic1', '1')

      expect(emitSessionEventSpy).toHaveBeenCalledWith({
        topic: 'topic1',
        event: {
          name: 'chainChanged',
          data: 1,
        },
        chainId: 'eip155:1',
      })
    })
  })

  describe('accountsChanged', () => {
    it('should call emitSessionEvent with the correct parameters', async () => {
      const emitSessionEventSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'emitSessionEvent')

      await wallet.accountsChanged('topic1', '1', toBeHex('0x123', 20))

      expect(emitSessionEventSpy).toHaveBeenCalledWith({
        topic: 'topic1',
        event: {
          name: 'accountsChanged',
          data: [toBeHex('0x123', 20)],
        },
        chainId: 'eip155:1',
      })
    })
  })

  describe('approveSession', () => {
    it('should approve the session with proposed required/optional chains/methods and required events', async () => {
      const approveSessionSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'approveSession')
      approveSessionSpy.mockResolvedValue({
        namespaces: {
          eip155: {},
        },
      } as unknown as SessionTypes.Struct)

      const proposal = {
        id: 123,
        params: {
          id: 456,
          pairingTopic: 'pairingTopic',
          expiry: 789,
          requiredNamespaces: {
            eip155: {
              chains: ['eip155:1'],
              methods: ['eth_sendTransaction', 'personal_sign'],
              events: ['chainChanged', 'accountsChanged'],
            },
          },
          optionalNamespaces: {
            eip155: {
              chains: ['eip155:43114', 'eip155:42161', 'eip155:8453', 'eip155:100', 'eip155:137', 'eip155:1101'],
              // Not included as optional
              methods: [
                'eth_sendTransaction',
                'personal_sign',
                'eth_accounts',
                'eth_requestAccounts',
                'eth_sendRawTransaction',
                'eth_sign',
                'eth_signTransaction',
                'eth_signTypedData',
                'eth_signTypedData_v3',
                'eth_signTypedData_v4',
                'wallet_switchEthereumChain',
                'wallet_addEthereumChain',
                'wallet_getPermissions',
                'wallet_requestPermissions',
                'wallet_registerOnboarding',
                'wallet_watchAsset',
                'wallet_scanQRCode',
              ],
              events: ['chainChanged', 'accountsChanged', 'message', 'disconnect', 'connect'],
            },
          },
        },
      } as unknown as WalletKitTypes.SessionProposal

      await wallet.approveSession(
        proposal,
        '43114', // Not in proposal, therefore not supported
        toBeHex('0x123', 20),
      )

      const namespaces = {
        eip155: {
          chains: ['eip155:1', 'eip155:43114'],
          methods: [
            'eth_sendTransaction',
            'personal_sign',
            'eth_accounts',
            'eth_sign',
            'eth_signTypedData',
            'eth_signTypedData_v4',
            'wallet_switchEthereumChain',
          ],
          events: ['chainChanged', 'accountsChanged'],
          accounts: [`eip155:1:${toBeHex('0x123', 20)}`, `eip155:43114:${toBeHex('0x123', 20)}`],
        },
      }

      expect(approveSessionSpy).toHaveBeenCalledWith({
        id: 123,
        namespaces,
      })
    })

    it('should call approveSession with correct namespace if no requiredNamespace is given', async () => {
      const approveSessionSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'approveSession')
      approveSessionSpy.mockResolvedValue({
        namespaces: {
          eip155: {},
        },
      } as unknown as SessionTypes.Struct)

      const proposal = {
        id: 123,
        params: {
          id: 456,
          pairingTopic: 'pairingTopic',
          expiry: 789,
          requiredNamespaces: {},
          optionalNamespaces: {
            eip155: {
              chains: ['eip155:43114', 'eip155:42161', 'eip155:8453', 'eip155:100', 'eip155:137', 'eip155:1101'],
              // Not included as optional
              methods: ['eth_sendTransaction', 'personal_sign', 'eth_accounts', 'eth_requestAccounts'],
              events: ['chainChanged', 'accountsChanged'],
            },
          },
        },
      } as unknown as WalletKitTypes.SessionProposal

      await wallet.approveSession(
        proposal,
        '43114', // Not in proposal, therefore not supported
        toBeHex('0x123', 20),
      )

      const namespaces = {
        eip155: {
          chains: ['eip155:43114'],
          methods: ['eth_accounts', 'personal_sign', 'eth_sendTransaction'],
          events: ['chainChanged', 'accountsChanged'],
          accounts: [`eip155:43114:${toBeHex('0x123', 20)}`],
        },
      }

      expect(approveSessionSpy).toHaveBeenCalledWith({
        id: 123,
        namespaces,
      })
    })

    it('should call updateSession with the correct parameters', async () => {
      const emitSessionEventSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'emitSessionEvent')
      jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'approveSession').mockResolvedValue({
        topic: 'topic',
        namespaces: {
          eip155: {},
        },
      } as unknown as SessionTypes.Struct)

      await wallet.approveSession(
        {
          id: 1,
          params: {
            id: 1,
            expiry: 1,
            relays: [],
            proposer: {
              publicKey: '123',
              metadata: {} as SignClientTypes.Metadata,
            },
            pairingTopic: '0x3456',
            requiredNamespaces: {} as ProposalTypes.RequiredNamespaces,
            optionalNamespaces: {} as ProposalTypes.OptionalNamespaces,
            expiryTimestamp: 2,
          },
          verifyContext: {} as Verify.Context,
        },
        '1',
        toBeHex('0x123', 20),
      )

      expect(emitSessionEventSpy).toHaveBeenCalledTimes(1)
      expect(emitSessionEventSpy).toHaveBeenNthCalledWith(1, {
        topic: 'topic',
        event: { data: 1, name: 'chainChanged' },
        chainId: 'eip155:1',
      })
    })

    it('should call emitSessionEvent with the correct parameters', async () => {
      const emitSpy = jest.spyOn(((wallet as any).web3Wallet as IWalletKit).events, 'emit')
      jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'approveSession').mockResolvedValue({
        topic: 'topic',
        namespaces: {
          eip155: {},
        },
      } as unknown as SessionTypes.Struct)

      await wallet.approveSession(
        {
          id: 1,
          params: {
            id: 1,
            expiry: 1,
            relays: [],
            pairingTopic: '0x3456',
            proposer: {
              publicKey: '123',
              metadata: {} as SignClientTypes.Metadata,
            },
            requiredNamespaces: {} as ProposalTypes.RequiredNamespaces,
            optionalNamespaces: {} as ProposalTypes.OptionalNamespaces,
            expiryTimestamp: 2,
          },
          verifyContext: {} as Verify.Context,
        },
        '1',
        toBeHex('0x123', 20),
      )

      expect(emitSpy).toHaveBeenCalledWith('session_add', { namespaces: { eip155: {} }, topic: 'topic' })
    })
  })

  describe('updateSession', () => {
    it('should extend the session namespace when switching to a new chain', async () => {
      const disconnectSessionSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'disconnectSession')
      const updateSessionSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'updateSession')

      const session = {
        topic: 'topic1',
        namespaces: {
          eip155: {
            chains: ['eip155:1'],
            accounts: [`eip155:1:${toBeHex('0x123', 20)}`],
            events: ['chainChanged', 'accountsChanged'],
            methods: [],
          },
        },
      } as unknown as SessionTypes.Struct

      await (wallet as any).updateSession(session, '69420', toBeHex('0x123', 20))

      expect(disconnectSessionSpy).not.toHaveBeenCalled()
      expect(updateSessionSpy).toHaveBeenCalledWith({
        topic: 'topic1',
        namespaces: {
          eip155: {
            chains: ['eip155:69420', 'eip155:1'],
            accounts: [`eip155:69420:${toBeHex('0x123', 20)}`, `eip155:1:${toBeHex('0x123', 20)}`],
            events: ['chainChanged', 'accountsChanged'],
            methods: [],
          },
        },
      })
    })

    it('should update the session with the correct namespace', async () => {
      const updateSessionSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'updateSession')
      const emitSessionEventSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'emitSessionEvent')

      const session = {
        topic: 'topic1',
        namespaces: {
          eip155: {
            chains: ['eip155:1'],
            accounts: [`eip155:1:${toBeHex('0x123', 20)}`],
            events: ['chainChanged', 'accountsChanged'],
            methods: [],
          },
        },
      } as unknown as SessionTypes.Struct

      await (wallet as any).updateSession(session, '1', toBeHex('0x456', 20))

      expect(updateSessionSpy).toHaveBeenCalledWith({
        topic: 'topic1',
        namespaces: {
          eip155: {
            chains: ['eip155:1'],
            accounts: [`eip155:1:${toBeHex('0x456', 20)}`, `eip155:1:${toBeHex('0x123', 20)}`],
            events: ['chainChanged', 'accountsChanged'],
            methods: [],
          },
        },
      })

      expect(emitSessionEventSpy).toHaveBeenCalledTimes(2)
    })

    it('should not update the session if the chainId and account is already in the namespace', async () => {
      const updateSessionSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'updateSession')
      const emitSessionEventSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'emitSessionEvent')

      const session = {
        topic: 'topic1',
        namespaces: {
          eip155: {
            chains: ['eip155:1'],
            accounts: [`eip155:1:${toBeHex('0x123', 20)}`],
          },
        },
      } as unknown as SessionTypes.Struct

      await (wallet as any).updateSession(session, '1', toBeHex('0x123', 20))

      expect(updateSessionSpy).not.toHaveBeenCalled()

      expect(emitSessionEventSpy).toHaveBeenCalledTimes(2)
    })

    it('should call emitSessionEvent with the correct parameters', async () => {
      const emitSessionEventSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'emitSessionEvent')

      const session = {
        topic: 'topic',
        namespaces: {
          eip155: {
            chains: ['eip155:1', 'eip155:5'],
            accounts: [`eip155:1:${toBeHex('0x123', 20)}`],
          },
        },
      } as unknown as SessionTypes.Struct

      await (wallet as any).updateSession(session, '5', toBeHex('0x456', 20))

      expect(emitSessionEventSpy).toHaveBeenCalledTimes(2)

      expect(emitSessionEventSpy).toHaveBeenNthCalledWith(1, {
        topic: 'topic',
        event: { data: 5, name: 'chainChanged' },
        chainId: 'eip155:5',
      })

      expect(emitSessionEventSpy).toHaveBeenNthCalledWith(2, {
        topic: 'topic',
        event: {
          name: 'accountsChanged',
          data: [toBeHex('0x456', 20)],
        },
        chainId: 'eip155:5',
      })
    })
  })

  describe('updateSessions', () => {
    it('should call updateSession for each active session', async () => {
      const session1 = { topic: 'topic1', namespaces: {} } as SessionTypes.Struct
      const session2 = { topic: 'topic2', namespaces: {} } as SessionTypes.Struct
      const updateSessionSpy = jest.spyOn(wallet as any, 'updateSession')
      jest.spyOn(wallet, 'getActiveSessions').mockReturnValue([session1, session2])

      await wallet.updateSessions('1', toBeHex('0x123', 20))

      expect(updateSessionSpy).toHaveBeenCalledTimes(2)
      expect(updateSessionSpy).toHaveBeenCalledWith(session1, '1', toBeHex('0x123', 20))
      expect(updateSessionSpy).toHaveBeenCalledWith(session2, '1', toBeHex('0x123', 20))
    })
  })

  describe('onSessionPropose', () => {
    it('should subscribe to session_proposal event', () => {
      const onSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'on')
      const offSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'off')

      const handler = jest.fn()

      const unsubscribe = wallet.onSessionPropose(handler)

      expect(onSpy).toHaveBeenCalledWith('session_proposal', handler)
      expect(offSpy).not.toHaveBeenCalled()

      unsubscribe()

      expect(offSpy).toHaveBeenCalledWith('session_proposal', handler)
    })
  })

  describe('onSessionAdd', () => {
    it('should subscribe to SESSION_ADD_EVENT event', () => {
      const onSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'on')
      const offSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'off')

      const handler = jest.fn()

      const unsubscribe = wallet.onSessionAdd(handler)

      expect(onSpy).toHaveBeenCalledWith('session_add', handler)
      expect(offSpy).not.toHaveBeenCalled()

      unsubscribe()

      expect(offSpy).toHaveBeenCalledWith('session_add', handler)
    })
  })

  describe('onSessionDelete', () => {
    it('should subscribe to session_delete event', () => {
      const onSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'on')
      const offSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'off')

      const handler = jest.fn()

      const unsubscribe = wallet.onSessionDelete(handler)

      expect(onSpy).toHaveBeenCalledWith('session_delete', handler)
      expect(offSpy).not.toHaveBeenCalled()

      unsubscribe()

      expect(offSpy).toHaveBeenCalledWith('session_delete', handler)
    })
  })

  describe('disconnectSession', () => {
    it('should call disconnectSession with the correct parameters', async () => {
      const session = { topic: 'topic1', namespaces: {} } as SessionTypes.Struct
      const disconnectSessionSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'disconnectSession')

      await wallet.disconnectSession(session)

      expect(disconnectSessionSpy).toHaveBeenCalledWith({
        topic: 'topic1',
        reason: {
          code: 6000,
          message: 'User disconnected.',
        },
      })
    })
  })

  describe('getActiveSessions', () => {
    it('should return an array of active sessions', () => {
      jest.spyOn((wallet as any).web3Wallet, 'getActiveSessions').mockReturnValue({
        topic1: { topic: 'topic1', namespaces: {} } as SessionTypes.Struct,
        topic2: { topic: 'topic2', namespaces: {} } as SessionTypes.Struct,
      })

      const activeSessions = wallet.getActiveSessions()

      expect(activeSessions).toEqual([
        { topic: 'topic1', namespaces: {} },
        { topic: 'topic2', namespaces: {} },
      ])
    })
  })

  describe('onRequest', () => {
    it('should subscribe to session_request event', () => {
      const handler = jest.fn()
      const onSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'on')
      const offSpy = jest.spyOn((wallet as any).web3Wallet as IWalletKit, 'off')

      const unsubscribe = wallet.onRequest(handler)

      expect(onSpy).toHaveBeenCalledWith('session_request', handler)
      expect(offSpy).not.toHaveBeenCalled()

      unsubscribe()

      expect(offSpy).toHaveBeenCalledWith('session_request', handler)
    })
  })

  describe('sendSessionResponse', () => {
    it('should call respondSessionRequest with the correct parameters', async () => {
      const respondSessionRequestSpy = jest
        .spyOn((wallet as any).web3Wallet as IWalletKit, 'respondSessionRequest')
        .mockResolvedValue(undefined)

      await wallet.sendSessionResponse('topic1', { id: 1, jsonrpc: '2.0', result: 'result' })

      expect(respondSessionRequestSpy).toHaveBeenCalledWith({
        topic: 'topic1',
        response: { id: 1, jsonrpc: '2.0', result: 'result' },
      })
    })
  })
})
