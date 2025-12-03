import { faker } from '@faker-js/faker'
import { getHeaderTitle } from './header'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { generateAddress } from '@safe-global/test'

const createBaseTxDetails = (txInfo: TransactionDetails['txInfo']): TransactionDetails =>
  ({
    safeAddress: generateAddress(),
    txId: faker.string.uuid(),
    executedAt: Date.now(),
    txStatus: 'SUCCESS',
    txInfo,
    txData: null,
    detailedExecutionInfo: null,
    txHash: faker.string.hexadecimal({ length: 64, prefix: '0x' }),
    safeAppInfo: null,
  }) as TransactionDetails

describe('getHeaderTitle', () => {
  describe('Transfer transactions', () => {
    it('returns "Sent" for outgoing transfers', () => {
      const txDetails = createBaseTxDetails({
        type: 'Transfer',
        sender: { value: generateAddress() },
        recipient: { value: generateAddress() },
        direction: 'OUTGOING',
        transferInfo: {
          type: 'NATIVE_COIN',
          value: '1000000000000000000',
        },
      })

      const result = getHeaderTitle(txDetails)

      expect(result).toBe('Sent')
    })

    it('returns "Received" for incoming transfers', () => {
      const txDetails = createBaseTxDetails({
        type: 'Transfer',
        sender: { value: generateAddress() },
        recipient: { value: generateAddress() },
        direction: 'INCOMING',
        transferInfo: {
          type: 'NATIVE_COIN',
          value: '1000000000000000000',
        },
      })

      const result = getHeaderTitle(txDetails)

      expect(result).toBe('Received')
    })

    it('returns "Received" for unknown direction transfers', () => {
      const txDetails = createBaseTxDetails({
        type: 'Transfer',
        sender: { value: generateAddress() },
        recipient: { value: generateAddress() },
        direction: 'UNKNOWN',
        transferInfo: {
          type: 'NATIVE_COIN',
          value: '1000000000000000000',
        },
      })

      const result = getHeaderTitle(txDetails)

      expect(result).toBe('Received')
    })

    it('handles ERC20 transfers', () => {
      const txDetails = createBaseTxDetails({
        type: 'Transfer',
        sender: { value: generateAddress() },
        recipient: { value: generateAddress() },
        direction: 'OUTGOING',
        transferInfo: {
          type: 'ERC20',
          tokenAddress: generateAddress(),
          tokenName: 'Test Token',
          tokenSymbol: 'TST',
          logoUri: null,
          decimals: 18,
          value: '1000000000000000000',
          trusted: true,
          imitation: false,
        },
      })

      const result = getHeaderTitle(txDetails)

      expect(result).toBe('Sent')
    })
  })

  describe('Swap order transactions', () => {
    it('returns "Swap order" for swap orders', () => {
      const txDetails = createBaseTxDetails({
        type: 'SwapOrder',
        uid: faker.string.uuid(),
        status: 'fulfilled',
        kind: 'sell',
        validUntil: Math.floor(Date.now() / 1000) + 3600,
        sellToken: {
          address: generateAddress(),
          decimals: 18,
          logoUri: null,
          name: 'Ether',
          symbol: 'ETH',
          trusted: true,
        },
        buyToken: {
          address: generateAddress(),
          decimals: 6,
          logoUri: null,
          name: 'USD Coin',
          symbol: 'USDC',
          trusted: true,
        },
        sellAmount: '1000000000000000000',
        buyAmount: '2000000000',
        executedSellAmount: '1000000000000000000',
        executedBuyAmount: '2000000000',
        explorerUrl: 'https://explorer.cow.fi',
        orderClass: 'market',
        executedFee: '0',
        executedFeeToken: {
          address: generateAddress(),
          decimals: 18,
          logoUri: null,
          name: 'Ether',
          symbol: 'ETH',
          trusted: true,
        },
        humanDescription: null,
        receiver: generateAddress(),
        owner: generateAddress(),
        fullAppData: null,
      })

      const result = getHeaderTitle(txDetails)

      expect(result).toBe('Swap order')
    })
  })

  describe('TWAP order transactions', () => {
    it('returns "Twap order" for TWAP orders', () => {
      const txInfo = {
        type: 'TwapOrder' as const,
        status: 'fulfilled' as const,
        kind: 'sell' as const,
        validUntil: Math.floor(Date.now() / 1000) + 3600,
        sellToken: {
          address: generateAddress(),
          decimals: 18,
          logoUri: null,
          name: 'Ether',
          symbol: 'ETH',
          trusted: true,
        },
        buyToken: {
          address: generateAddress(),
          decimals: 6,
          logoUri: null,
          name: 'USD Coin',
          symbol: 'USDC',
          trusted: true,
        },
        sellAmount: '1000000000000000000',
        buyAmount: '2000000000',
        executedSellAmount: '1000000000000000000',
        executedBuyAmount: '2000000000',
        numberOfParts: '4',
        partSellAmount: '250000000000000000',
        minPartLimit: '500000000',
        timeBetweenParts: 3600,
        startTime: { startType: 'AT_MINING_TIME' },
        executedFee: '0',
        executedFeeToken: {
          address: generateAddress(),
          decimals: 18,
          logoUri: null,
          name: 'Ether',
          symbol: 'ETH',
          trusted: true,
        },
        humanDescription: null,
        receiver: generateAddress(),
        owner: generateAddress(),
        fullAppData: null,
      } as TransactionDetails['txInfo']

      const txDetails = createBaseTxDetails(txInfo)
      const result = getHeaderTitle(txDetails)

      expect(result).toBe('Twap order')
    })
  })

  describe('Settings change transactions', () => {
    it('returns "Add signer" for add owner settings change', () => {
      const txDetails = createBaseTxDetails({
        type: 'SettingsChange',
        dataDecoded: {
          method: 'addOwnerWithThreshold',
          parameters: [],
        },
        settingsInfo: {
          type: 'ADD_OWNER',
          owner: { value: generateAddress() },
          threshold: 2,
        },
      })

      const result = getHeaderTitle(txDetails)

      expect(result).toBe('Add signer')
    })

    it('returns "Remove signer" for remove owner settings change', () => {
      const txDetails = createBaseTxDetails({
        type: 'SettingsChange',
        dataDecoded: {
          method: 'removeOwner',
          parameters: [],
        },
        settingsInfo: {
          type: 'REMOVE_OWNER',
          owner: { value: generateAddress() },
          threshold: 1,
        },
      })

      const result = getHeaderTitle(txDetails)

      expect(result).toBe('Remove signer')
    })

    it('returns "Change threshold" for change threshold settings change', () => {
      const txDetails = createBaseTxDetails({
        type: 'SettingsChange',
        dataDecoded: {
          method: 'changeThreshold',
          parameters: [],
        },
        settingsInfo: {
          type: 'CHANGE_THRESHOLD',
          threshold: 3,
        },
      })

      const result = getHeaderTitle(txDetails)

      expect(result).toBe('Change threshold')
    })

    it('returns "Transaction details" for other settings changes', () => {
      const txDetails = createBaseTxDetails({
        type: 'SettingsChange',
        dataDecoded: {
          method: 'setGuard',
          parameters: [],
        },
        settingsInfo: {
          type: 'SET_GUARD',
          guard: { value: generateAddress() },
        },
      })

      const result = getHeaderTitle(txDetails)

      expect(result).toBe('Transaction details')
    })
  })

  describe('Custom transactions', () => {
    it('returns "Transaction details" for custom transactions', () => {
      const txDetails = createBaseTxDetails({
        type: 'Custom',
        to: { value: generateAddress() },
        value: '0',
        dataSize: '68',
        methodName: 'transfer',
        isCancellation: false,
      })

      const result = getHeaderTitle(txDetails)

      expect(result).toBe('Transaction details')
    })
  })

  describe('Creation transactions', () => {
    it('returns "Transaction details" for creation transactions', () => {
      const txDetails = createBaseTxDetails({
        type: 'Creation',
        creator: { value: generateAddress() },
        transactionHash: faker.string.hexadecimal({ length: 64, prefix: '0x' }),
        implementation: { value: generateAddress() },
        factory: { value: generateAddress() },
      })

      const result = getHeaderTitle(txDetails)

      expect(result).toBe('Transaction details')
    })
  })
})
