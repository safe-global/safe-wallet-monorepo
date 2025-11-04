import { toBeHex } from 'ethers'
import { http, HttpResponse } from 'msw'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { setBaseUrl } from '../gateway-utils'
import { server } from '@/tests/server'

import { _parseServiceWorkerWebhookPushNotification } from '../notifications'
import { WebhookType } from '../webhook-types'
import type {
  ConfirmationRequestEvent,
  ExecutedMultisigTransactionEvent,
  IncomingEtherEvent,
  IncomingTokenEvent,
  ModuleTransactionEvent,
  NewConfirmationEvent,
  OutgoingEtherEvent,
  OutgoingTokenEvent,
  PendingMultisigTransactionEvent,
  SafeCreatedEvent,
} from '../webhook-types'

const GATEWAY_URL = 'https://safe-client.staging.5afe.dev'

// Set base URL for service worker context (uses direct fetch, not Redux)
setBaseUrl(GATEWAY_URL)

Object.defineProperty(self, 'location', {
  value: {
    origin: 'https://app.safe.global',
  },
})

// Helper to mock chains response
const mockChainsResponse = (chains: Chain[]) => {
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains`, () => {
      return HttpResponse.json({
        count: chains.length,
        next: null,
        previous: null,
        results: chains,
      })
    }),
  )
}

// Helper to mock empty chains response
const mockNoChainsResponse = () => mockChainsResponse([])

// Helper to create a chain mock
const createChainMock = (overrides: Partial<Chain> = {}): Chain =>
  ({
    chainName: 'Mainnet',
    chainId: '1',
    shortName: 'eth',
    ...overrides,
  }) as Chain

// Helper to mock balances response
const mockBalancesResponse = (chainId: string, safeAddress: string, items: Balances['items']) => {
  server.use(
    http.get<never, never, Balances>(`${GATEWAY_URL}/v1/chains/${chainId}/safes/${safeAddress}/balances/USD`, () => {
      return HttpResponse.json({
        items,
        fiatTotal: '1000',
      } as Balances)
    }),
  )
}

// Helper to mock balances error
const mockBalancesError = (chainId: string, safeAddress: string) => {
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/${chainId}/safes/${safeAddress}/balances/USD`, () => {
      return HttpResponse.error()
    }),
  )
}

describe('parseWebhookPushNotification', () => {
  describe('should parse EXECUTED_MULTISIG_TRANSACTION payloads', () => {
    const payload: Omit<ExecutedMultisigTransactionEvent, 'failed'> = {
      type: WebhookType.EXECUTED_MULTISIG_TRANSACTION,
      chainId: '1',
      address: toBeHex('0x1', 20),
      safeTxHash: toBeHex('0x3', 32),
      txHash: toBeHex('0x4', 32),
    }

    describe('successful transactions', () => {
      it('with chain info', async () => {
        mockChainsResponse([createChainMock({ chainId: payload.chainId })])

        const notification = await _parseServiceWorkerWebhookPushNotification({
          ...payload,
          failed: 'false',
        })

        expect(notification).toEqual({
          title: 'Transaction executed',
          body: 'Safe 0x0000...0001 on Mainnet executed transaction 0x0000...0004.',
          link: 'https://app.safe.global/transactions/tx?safe=eth:0x0000000000000000000000000000000000000001&id=0x0000000000000000000000000000000000000000000000000000000000000003',
        })
      })

      it('without chain info', async () => {
        mockNoChainsResponse()

        const notification = await _parseServiceWorkerWebhookPushNotification({
          ...payload,
          failed: 'false',
        })

        expect(notification).toEqual({
          title: 'Transaction executed',
          body: 'Safe 0x0000...0001 on chain 1 executed transaction 0x0000...0004.',
          link: 'https://app.safe.global',
        })
      })
    })

    describe('failed transactions', () => {
      it('with chain info', async () => {
        mockChainsResponse([createChainMock({ chainId: payload.chainId })])

        const notification = await _parseServiceWorkerWebhookPushNotification({
          ...payload,
          failed: 'true',
        })

        expect(notification).toEqual({
          title: 'Transaction failed',
          body: 'Safe 0x0000...0001 on Mainnet failed to execute transaction 0x0000...0004.',
          link: 'https://app.safe.global/transactions/tx?safe=eth:0x0000000000000000000000000000000000000001&id=0x0000000000000000000000000000000000000000000000000000000000000003',
        })
      })

      it('without chain info', async () => {
        mockNoChainsResponse()

        const notification = await _parseServiceWorkerWebhookPushNotification({
          ...payload,
          failed: 'true',
        })

        expect(notification).toEqual({
          title: 'Transaction failed',
          body: 'Safe 0x0000...0001 on chain 1 failed to execute transaction 0x0000...0004.',
          link: 'https://app.safe.global',
        })
      })
    })
  })

  describe('should parse INCOMING_ETHER payloads', () => {
    const payload: IncomingEtherEvent = {
      type: WebhookType.INCOMING_ETHER,
      chainId: '137',
      address: toBeHex('0x1', 20),
      txHash: toBeHex('0x3', 32),
      value: '1000000000000000000',
    }

    it('with chain info', async () => {
      mockChainsResponse([
        createChainMock({
          chainName: 'Polygon',
          chainId: payload.chainId,
          shortName: 'matic',
          nativeCurrency: { name: 'Matic', symbol: 'MATIC', decimals: 18, logoUri: '' },
        }),
      ])

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual({
        title: 'Matic received',
        body: 'Safe 0x0000...0001 on Polygon received 1.0 MATIC in transaction 0x0000...0003.',
        link: 'https://app.safe.global/transactions/history?safe=matic:0x0000000000000000000000000000000000000001',
      })
    })

    it('without chain info', async () => {
      mockNoChainsResponse()

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual({
        title: 'Ether received',
        body: 'Safe 0x0000...0001 on chain 137 received 1.0 ETH in transaction 0x0000...0003.',
        link: 'https://app.safe.global',
      })
    })
  })

  describe('should parse INCOMING_TOKEN payloads', () => {
    const payload: IncomingTokenEvent = {
      type: WebhookType.INCOMING_TOKEN,
      chainId: '1',
      address: toBeHex('0x1', 20),
      tokenAddress: toBeHex('0x2', 20),
      txHash: toBeHex('0x3', 32),
    }

    const erc20Payload: IncomingTokenEvent = {
      ...payload,
      value: '1000000000000000000',
    }

    const fakeTokenBalance = {
      tokenInfo: {
        address: payload.tokenAddress,
        decimals: 18,
        name: 'Fake',
        symbol: 'FAKE',
        type: 'ERC20' as const,
        logoUri: 'https://example.com/fake.png',
      },
      balance: '1000000000000000000',
      fiatBalance: '1000',
      fiatConversion: '1000',
    }

    it('with chain and token info', async () => {
      mockChainsResponse([createChainMock({ chainId: payload.chainId })])
      mockBalancesResponse(payload.chainId, payload.address, [fakeTokenBalance])

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual({
        title: 'Fake received',
        body: 'Safe 0x0000...0001 on Mainnet received some FAKE in transaction 0x0000...0003.',
        link: 'https://app.safe.global/transactions/history?safe=eth:0x0000000000000000000000000000000000000001',
      })

      const erc20Notification = await _parseServiceWorkerWebhookPushNotification(erc20Payload)

      expect(erc20Notification).toEqual({
        title: 'Fake received',
        body: 'Safe 0x0000...0001 on Mainnet received 1.0 FAKE in transaction 0x0000...0003.',
        link: 'https://app.safe.global/transactions/history?safe=eth:0x0000000000000000000000000000000000000001',
      })
    })

    it('without chain info', async () => {
      mockNoChainsResponse()
      mockBalancesResponse(payload.chainId, payload.address, [fakeTokenBalance])

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual({
        title: 'Fake received',
        body: 'Safe 0x0000...0001 on chain 1 received some FAKE in transaction 0x0000...0003.',
        link: 'https://app.safe.global',
      })

      const erc20Notification = await _parseServiceWorkerWebhookPushNotification(erc20Payload)

      expect(erc20Notification).toEqual({
        title: 'Fake received',
        body: 'Safe 0x0000...0001 on chain 1 received 1.0 FAKE in transaction 0x0000...0003.',
        link: 'https://app.safe.global',
      })
    })

    it('without token info', async () => {
      mockChainsResponse([createChainMock({ chainId: payload.chainId })])
      mockBalancesError(payload.chainId, payload.address)

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual({
        title: 'Token received',
        body: 'Safe 0x0000...0001 on Mainnet received some tokens in transaction 0x0000...0003.',
        link: 'https://app.safe.global/transactions/history?safe=eth:0x0000000000000000000000000000000000000001',
      })

      const erc20Notification = await _parseServiceWorkerWebhookPushNotification(erc20Payload)

      expect(erc20Notification).toEqual({
        title: 'Token received',
        body: 'Safe 0x0000...0001 on Mainnet received some tokens in transaction 0x0000...0003.',
        link: 'https://app.safe.global/transactions/history?safe=eth:0x0000000000000000000000000000000000000001',
      })
    })

    it('without chain and balance info', async () => {
      mockNoChainsResponse()
      mockBalancesError(payload.chainId, payload.address)

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual({
        title: 'Token received',
        body: 'Safe 0x0000...0001 on chain 1 received some tokens in transaction 0x0000...0003.',
        link: 'https://app.safe.global',
      })

      const erc20Notification = await _parseServiceWorkerWebhookPushNotification(erc20Payload)

      expect(erc20Notification).toEqual({
        title: 'Token received',
        body: 'Safe 0x0000...0001 on chain 1 received some tokens in transaction 0x0000...0003.',
        link: 'https://app.safe.global',
      })
    })
  })

  describe('should parse MODULE_TRANSACTION payloads', () => {
    const payload: ModuleTransactionEvent = {
      type: WebhookType.MODULE_TRANSACTION,
      chainId: '1',
      address: toBeHex('0x1', 20),
      module: toBeHex('0x2', 20),
      txHash: toBeHex('0x3', 32),
    }

    it('with chain info', async () => {
      mockChainsResponse([createChainMock({ chainId: '1' })])

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual({
        title: 'Module transaction',
        body: 'Safe 0x0000...0001 on Mainnet executed a module transaction 0x0000...0003 from module 0x0000...0002.',
        link: 'https://app.safe.global/transactions/history?safe=eth:0x0000000000000000000000000000000000000001',
      })
    })

    it('without chain info', async () => {
      mockNoChainsResponse()

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual({
        title: 'Module transaction',
        body: 'Safe 0x0000...0001 on chain 1 executed a module transaction 0x0000...0003 from module 0x0000...0002.',
        link: 'https://app.safe.global',
      })
    })
  })

  describe('should parse CONFIRMATION_REQUEST payloads', () => {
    const payload: ConfirmationRequestEvent = {
      type: WebhookType.CONFIRMATION_REQUEST,
      chainId: '1',
      address: toBeHex('0x1', 20),
      safeTxHash: toBeHex('0x3', 32),
    }

    it('with chain info', async () => {
      mockChainsResponse([createChainMock({ chainId: '1' })])

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual({
        title: 'Confirmation request',
        body: 'Safe 0x0000...0001 on Mainnet has a new confirmation request for transaction 0x0000...0003.',
        link: 'https://app.safe.global/transactions/tx?safe=eth:0x0000000000000000000000000000000000000001&id=0x0000000000000000000000000000000000000000000000000000000000000003',
      })
    })

    it('without chain info', async () => {
      mockNoChainsResponse()

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual({
        title: 'Confirmation request',
        body: 'Safe 0x0000...0001 on chain 1 has a new confirmation request for transaction 0x0000...0003.',
        link: 'https://app.safe.global',
      })
    })
  })

  // We do not pre-emptively subscribe to Safes before they are created
  describe('should not parse SAFE_CREATED payloads', () => {
    const payload: SafeCreatedEvent = {
      type: WebhookType.SAFE_CREATED,
      chainId: '1',
      address: toBeHex('0x1', 20),
      txHash: toBeHex('0x3', 32),
      blockNumber: '1',
    }
    it('with chain info', async () => {
      mockChainsResponse([createChainMock({ chainId: '1' })])

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toBe(undefined)
    })

    it('without chain info', async () => {
      mockNoChainsResponse()

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toBe(undefined)
    })
  })

  // Not enabled in the Transaction Service
  describe('should not parse NEW_CONFIRMATION payloads', () => {
    const payload: NewConfirmationEvent = {
      type: WebhookType._NEW_CONFIRMATION,
      chainId: '1',
      address: toBeHex('0x1', 20),
      owner: toBeHex('0x2', 20),
      safeTxHash: toBeHex('0x3', 32),
    }

    it('with chain info', async () => {
      mockChainsResponse([createChainMock({ chainId: payload.chainId })])

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual(undefined)
    })

    it('without chain info', async () => {
      mockNoChainsResponse()

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual(undefined)
    })
  })

  // Not enabled in the Transaction Service
  describe('should not parse PENDING_MULTISIG_TRANSACTION payloads', () => {
    const payload: PendingMultisigTransactionEvent = {
      type: WebhookType._PENDING_MULTISIG_TRANSACTION,
      chainId: '1',
      address: toBeHex('0x1', 20),
      safeTxHash: toBeHex('0x3', 32),
    }

    it('with chain info', async () => {
      mockChainsResponse([createChainMock({ chainId: payload.chainId })])

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual(undefined)
    })

    it('without chain info', async () => {
      mockNoChainsResponse()

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual(undefined)
    })
  })

  // Not enabled in the Transaction Service
  describe('should not parse OUTGOING_ETHER payloads', () => {
    const payload: OutgoingEtherEvent = {
      type: WebhookType._OUTGOING_ETHER,
      chainId: '137',
      address: toBeHex('0x1', 20),
      txHash: toBeHex('0x3', 32),
      value: '1000000000000000000',
    }

    it('with chain info', async () => {
      mockChainsResponse([
        createChainMock({
          chainName: 'Polygon',
          chainId: payload.chainId,
          shortName: 'matic',
          nativeCurrency: { name: 'Matic', symbol: 'MATIC', decimals: 18, logoUri: '' },
        }),
      ])

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual(undefined)
    })

    it('without chain info', async () => {
      mockNoChainsResponse()

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual(undefined)
    })
  })

  // Not enabled in the Transaction Service
  describe('should not parse OUTGOING_TOKEN payloads', () => {
    const payload: OutgoingTokenEvent = {
      type: WebhookType._OUTGOING_TOKEN,
      chainId: '1',
      address: toBeHex('0x1', 20),
      tokenAddress: toBeHex('0x2', 20),
      txHash: toBeHex('0x3', 32),
    }

    const erc20Payload: OutgoingTokenEvent = {
      ...payload,
      value: '1000000000000000000',
    }

    const fakeTokenBalance = {
      tokenInfo: {
        address: payload.tokenAddress,
        decimals: 18,
        name: 'Fake',
        symbol: 'FAKE',
        type: 'ERC20' as const,
        logoUri: 'https://example.com/fake.png',
      },
      balance: '1000000000000000000',
      fiatBalance: '1000',
      fiatConversion: '1000',
    }

    it('with chain and token info', async () => {
      mockChainsResponse([createChainMock({ chainId: payload.chainId })])
      mockBalancesResponse(payload.chainId, payload.address, [fakeTokenBalance])

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual(undefined)

      const erc20Notification = await _parseServiceWorkerWebhookPushNotification(erc20Payload)

      expect(erc20Notification).toEqual(undefined)
    })

    it('with chain and empty token info', async () => {
      mockChainsResponse([createChainMock({ chainId: payload.chainId })])
      mockBalancesResponse(payload.chainId, payload.address, [])

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual(undefined)

      const erc20Notification = await _parseServiceWorkerWebhookPushNotification(erc20Payload)

      expect(erc20Notification).toEqual(undefined)
    })

    it('without chain info', async () => {
      mockNoChainsResponse()
      mockBalancesResponse(payload.chainId, payload.address, [fakeTokenBalance])

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual(undefined)

      const erc20Notification = await _parseServiceWorkerWebhookPushNotification(erc20Payload)

      expect(erc20Notification).toEqual(undefined)
    })

    it('without token info', async () => {
      mockChainsResponse([createChainMock({ chainId: payload.chainId })])
      mockBalancesError(payload.chainId, payload.address)

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual(undefined)

      const erc20Notification = await _parseServiceWorkerWebhookPushNotification(erc20Payload)

      expect(erc20Notification).toEqual(undefined)
    })

    it('without chain and balance info', async () => {
      mockNoChainsResponse()
      mockBalancesError(payload.chainId, payload.address)

      const notification = await _parseServiceWorkerWebhookPushNotification(payload)

      expect(notification).toEqual(undefined)

      const erc20Notification = await _parseServiceWorkerWebhookPushNotification(erc20Payload)

      expect(erc20Notification).toEqual(undefined)
    })
  })
})
