import { faker } from '@faker-js/faker'
import extractTxInfo from './extractTx'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { generateAddress, generateSignature, generateSafeTxHash } from '@safe-global/test'

const createMultisigExecutionInfo = (overrides = {}) => ({
  type: 'MULTISIG' as const,
  nonce: faker.number.int({ min: 0, max: 100 }),
  confirmationsRequired: 2,
  confirmationsSubmitted: 1,
  confirmations: [],
  missingSigners: null,
  baseGas: '21000',
  gasPrice: '1000000000',
  safeTxGas: '50000',
  gasToken: '0x0000000000000000000000000000000000000000',
  refundReceiver: { value: '0x0000000000000000000000000000000000000000' },
  submittedAt: Date.now(),
  safeTxHash: generateSafeTxHash(),
  signers: [{ value: generateAddress() }],
  rejectors: [],
  trusted: true,
  ...overrides,
})

const createBaseTxDetails = (overrides: Partial<TransactionDetails> = {}): TransactionDetails =>
  ({
    safeAddress: generateAddress(),
    txId: faker.string.uuid(),
    executedAt: null,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: {
      type: 'Custom',
      to: { value: generateAddress() },
      value: '0',
      dataSize: '0',
      methodName: null,
      isCancellation: false,
    },
    txData: {
      hexData: '0x',
      dataDecoded: null,
      to: { value: generateAddress() },
      value: '0',
      operation: 0,
      addressInfoIndex: null,
      trustedDelegateCallTarget: null,
    },
    detailedExecutionInfo: createMultisigExecutionInfo(),
    txHash: null,
    safeAppInfo: null,
    ...overrides,
  }) as TransactionDetails

describe('extractTxInfo', () => {
  const safeAddress = generateAddress()

  describe('Native Transfer transactions', () => {
    it('extracts native token transfer correctly', () => {
      const recipientAddress = generateAddress()
      const txDetails = createBaseTxDetails({
        txInfo: {
          type: 'Transfer',
          sender: { value: safeAddress },
          recipient: { value: recipientAddress },
          direction: 'OUTGOING',
          transferInfo: {
            type: 'NATIVE_COIN',
            value: '1000000000000000000',
          },
        },
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.txParams.value).toBe('1000000000000000000')
      expect(result.txParams.to).toBe(recipientAddress)
      expect(result.txParams.data).toBe('0x')
    })
  })

  describe('ERC20 Transfer transactions', () => {
    it('extracts ERC20 token transfer correctly', () => {
      const tokenAddress = generateAddress()
      const recipientAddress = generateAddress()
      const txDetails = createBaseTxDetails({
        txInfo: {
          type: 'Transfer',
          sender: { value: safeAddress },
          recipient: { value: recipientAddress },
          direction: 'OUTGOING',
          transferInfo: {
            type: 'ERC20',
            tokenAddress,
            tokenName: 'Test Token',
            tokenSymbol: 'TST',
            logoUri: null,
            decimals: 18,
            value: '1000000000000000000',
            trusted: true,
            imitation: false,
          },
        },
        txData: {
          hexData: '0xa9059cbb',
          dataDecoded: null,
          to: { value: tokenAddress },
          value: '0',
          operation: 0,
          addressInfoIndex: null,
          trustedDelegateCallTarget: null,
        },
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.txParams.to).toBe(tokenAddress)
      expect(result.txParams.value).toBe('0')
    })
  })

  describe('Custom transactions', () => {
    it('extracts custom transaction correctly', () => {
      const toAddress = generateAddress()
      const value = '500000000000000000'
      const txDetails = createBaseTxDetails({
        txInfo: {
          type: 'Custom',
          to: { value: toAddress },
          value,
          dataSize: '68',
          methodName: 'transfer',
          isCancellation: false,
        },
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.txParams.to).toBe(toAddress)
      expect(result.txParams.value).toBe(value)
    })
  })

  describe('SwapOrder transactions', () => {
    it('extracts SwapOrder transaction correctly', () => {
      const toAddress = generateAddress()
      const txDetails = createBaseTxDetails({
        txInfo: {
          type: 'SwapOrder',
          uid: faker.string.uuid(),
          status: 'presignaturePending',
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
          executedSellAmount: '0',
          executedBuyAmount: '0',
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
          receiver: safeAddress,
          owner: safeAddress,
          fullAppData: null,
        },
        txData: {
          hexData: '0x1234',
          dataDecoded: null,
          to: { value: toAddress },
          value: '0',
          operation: 0,
          addressInfoIndex: null,
          trustedDelegateCallTarget: null,
        },
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.txParams.to).toBe(toAddress)
      expect(result.txParams.value).toBe('0')
    })
  })

  describe('SettingsChange transactions', () => {
    it('extracts SettingsChange transaction with safe address as to', () => {
      const txDetails = createBaseTxDetails({
        txInfo: {
          type: 'SettingsChange',
          dataDecoded: {
            method: 'addOwnerWithThreshold',
            parameters: [
              { name: 'owner', type: 'address', value: generateAddress() },
              { name: '_threshold', type: 'uint256', value: '2' },
            ],
          },
          settingsInfo: {
            type: 'ADD_OWNER',
            owner: { value: generateAddress() },
            threshold: 2,
          },
        },
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.txParams.to).toBe(safeAddress)
      expect(result.txParams.value).toBe('0')
    })
  })

  describe('Creation transactions', () => {
    it('extracts Creation transaction with safe address as to', () => {
      const txDetails = createBaseTxDetails({
        txInfo: {
          type: 'Creation',
          creator: { value: generateAddress() },
          transactionHash: generateSafeTxHash(),
          implementation: { value: generateAddress() },
          factory: { value: generateAddress() },
        },
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.txParams.to).toBe(safeAddress)
      expect(result.txParams.value).toBe('0')
    })
  })

  describe('Signature extraction', () => {
    it('extracts signatures from confirmations', () => {
      const signer1 = generateAddress()
      const signer2 = generateAddress()
      const signature1 = generateSignature()
      const signature2 = generateSignature()

      const txDetails = createBaseTxDetails({
        detailedExecutionInfo: createMultisigExecutionInfo({
          confirmations: [
            { signer: { value: signer1 }, signature: signature1, submittedAt: Date.now() },
            { signer: { value: signer2 }, signature: signature2, submittedAt: Date.now() },
          ],
        }),
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.signatures[signer1]).toBe(signature1)
      expect(result.signatures[signer2]).toBe(signature2)
    })

    it('handles missing signatures gracefully', () => {
      const signer = generateAddress()
      const txDetails = createBaseTxDetails({
        detailedExecutionInfo: createMultisigExecutionInfo({
          confirmations: [{ signer: { value: signer }, signature: null, submittedAt: Date.now() }],
        }),
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.signatures[signer]).toBe('')
    })
  })

  describe('Gas parameters extraction', () => {
    it('extracts gas parameters from multisig execution info', () => {
      const txDetails = createBaseTxDetails({
        detailedExecutionInfo: createMultisigExecutionInfo({
          baseGas: '50000',
          gasPrice: '2000000000',
          safeTxGas: '100000',
          gasToken: generateAddress(),
          refundReceiver: { value: generateAddress() },
        }),
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.txParams.baseGas).toBe('50000')
      expect(result.txParams.gasPrice).toBe('2000000000')
      expect(result.txParams.safeTxGas).toBe('100000')
    })

    it('uses default values when no multisig execution info', () => {
      const txDetails = createBaseTxDetails({
        detailedExecutionInfo: {
          type: 'MODULE',
          address: { value: generateAddress() },
        },
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.txParams.baseGas).toBe('0')
      expect(result.txParams.gasPrice).toBe('0')
      expect(result.txParams.safeTxGas).toBe('0')
      expect(result.txParams.gasToken).toBe('0x0000000000000000000000000000000000000000')
    })
  })

  describe('Operation type', () => {
    it('extracts CALL operation', () => {
      const txDetails = createBaseTxDetails({
        txData: {
          hexData: '0x',
          dataDecoded: null,
          to: { value: generateAddress() },
          value: '0',
          operation: 0,
          addressInfoIndex: null,
          trustedDelegateCallTarget: null,
        },
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.txParams.operation).toBe(0)
    })

    it('extracts DELEGATECALL operation', () => {
      const txDetails = createBaseTxDetails({
        txData: {
          hexData: '0x',
          dataDecoded: null,
          to: { value: generateAddress() },
          value: '0',
          operation: 1,
          addressInfoIndex: null,
          trustedDelegateCallTarget: null,
        },
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.txParams.operation).toBe(1)
    })
  })

  describe('Nonce extraction', () => {
    it('extracts nonce from multisig execution info', () => {
      const txDetails = createBaseTxDetails({
        detailedExecutionInfo: createMultisigExecutionInfo({ nonce: 42 }),
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.txParams.nonce).toBe(42)
    })

    it('defaults to 0 for non-multisig execution', () => {
      const txDetails = createBaseTxDetails({
        detailedExecutionInfo: {
          type: 'MODULE',
          address: { value: generateAddress() },
        },
      })

      const result = extractTxInfo(txDetails, safeAddress)

      expect(result.txParams.nonce).toBe(0)
    })
  })
})
