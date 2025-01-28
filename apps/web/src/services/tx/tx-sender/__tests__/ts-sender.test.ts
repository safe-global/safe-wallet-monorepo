import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import type Safe from '@safe-global/protocol-kit'
import type { MultiSendCallOnlyContractImplementationType } from '@safe-global/protocol-kit'
import { type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { getTransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import extractTxInfo from '../../extractTxInfo'
import proposeTx from '../../proposeTransaction'
import * as txEvents from '../../txEvents'
import {
  createTx,
  createExistingTx,
  createRejectTx,
  dispatchTxExecution,
  dispatchTxProposal,
  dispatchTxSigning,
  dispatchBatchExecutionRelay,
} from '..'
import {
  BrowserProvider,
  type TransactionReceipt,
  zeroPadValue,
  type JsonRpcProvider,
  type JsonRpcSigner,
} from 'ethers'
import * as safeContracts from '@/services/contracts/safeContracts'

import * as web3 from '@/hooks/wallets/web3'

const setupFetchStub = (data: any) => () => {
  return Promise.resolve({
    json: () => Promise.resolve(data),
    status: 200,
    ok: true,
  })
}
import { toBeHex } from 'ethers'
import { generatePreValidatedSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'
import { createMockSafeTransaction } from '@/tests/transactions'
import { MockEip1193Provider } from '@/tests/mocks/providers'
import { SimpleTxWatcher } from '@/utils/SimpleTxWatcher'

const SIGNER_ADDRESS = '0x1234567890123456789012345678901234567890'
const TX_HASH = '0x1234567890'
// Mock getTransactionDetails
jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  ...jest.requireActual('@safe-global/safe-gateway-typescript-sdk'),
  getTransactionDetails: jest.fn(),
  postSafeGasEstimation: jest.fn(() => Promise.resolve({ safeTxGas: 60000, recommendedNonce: 17 })),
  Operation: {
    CALL: 0,
  },
  relayTransaction: jest.fn(() => Promise.resolve({ taskId: '0xdead1' })),
  __esModule: true,
}))

// Mock extractTxInfo
jest.mock('../../extractTxInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    txParams: {},
    signatures: [],
  })),
}))

// Mock proposeTx
jest.mock('../../proposeTransaction', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({ txId: '123' })),
}))

// Mock Safe SDK
const mockSafeSDK = {
  createTransaction: jest.fn(() => ({
    signatures: new Map(),
    addSignature: jest.fn(),
    data: {
      nonce: 1,
    },
  })),
  createRejectionTransaction: jest.fn(() => ({
    addSignature: jest.fn(),
  })),
  signTransaction: jest.fn(),
  executeTransaction: jest.fn(() =>
    Promise.resolve({
      hash: TX_HASH,
      transactionResponse: {
        wait: jest.fn(() => Promise.resolve({})),
      },
    }),
  ),
  connect: jest.fn(() => Promise.resolve(mockSafeSDK)),
  getChainId: jest.fn(() => Promise.resolve(4)),
  getAddress: jest.fn(() => '0x0000000000000000000000000000000000000123'),
  getTransactionHash: jest.fn(() => Promise.resolve('0x1234567890')),
  getContractVersion: jest.fn(() => Promise.resolve('1.1.1')),
  getEthAdapter: jest.fn(() => ({
    getSignerAddress: jest.fn(() => Promise.resolve(SIGNER_ADDRESS)),
  })),
} as unknown as Safe

describe('txSender', () => {
  beforeAll(() => {
    const mockBrowserProvider = new BrowserProvider(MockEip1193Provider)

    jest.spyOn(mockBrowserProvider, 'getSigner').mockImplementation(
      async () =>
        Promise.resolve({
          getAddress: jest.fn(() => Promise.resolve('0x0000000000000000000000000000000000000123')),
          provider: MockEip1193Provider,
        }) as unknown as JsonRpcSigner,
    )

    jest.spyOn(web3, 'createWeb3').mockImplementation(() => mockBrowserProvider)
    jest.spyOn(web3, 'getWeb3ReadOnly').mockReturnValue({} as unknown as JsonRpcProvider)

    setSafeSDK(mockSafeSDK)

    jest.spyOn(txEvents, 'txDispatch')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTx', () => {
    it('should create a tx', async () => {
      const txParams = {
        to: '0x123',
        value: '1',
        data: '0x0',
        safeTxGas: '60000',
      }
      await createTx(txParams)

      const safeTransactionData = {
        to: '0x123',
        value: '1',
        data: '0x0',
        safeTxGas: '60000',
      }
      expect(mockSafeSDK.createTransaction).toHaveBeenCalledWith({ transactions: [{ ...safeTransactionData }] })
    })

    it('should create a tx with a given nonce', async () => {
      const txParams = {
        to: '0x123',
        value: '1',
        data: '0x0',
        nonce: 100,
      }
      await createTx(txParams, 18)

      const safeTransactionData = {
        to: '0x123',
        value: '1',
        data: '0x0',
        nonce: 18,
      }
      expect(mockSafeSDK.createTransaction).toHaveBeenCalledWith({ transactions: [{ ...safeTransactionData }] })
    })
  })

  describe('createExistingTx', () => {
    it('should create a tx from an existing proposal', async () => {
      const tx = await createExistingTx('4', '0x123', '0x345')

      expect(getTransactionDetails).toHaveBeenCalledWith('4', '0x345')
      expect(extractTxInfo).toHaveBeenCalled()
      expect(mockSafeSDK.createTransaction).toHaveBeenCalled()

      expect(tx).toBeDefined()
      expect(tx.addSignature).toBeDefined()
    })
  })

  describe('createRejectTx', () => {
    it('should create a tx to reject a proposal', async () => {
      const tx = await createRejectTx(1)

      expect(mockSafeSDK.createRejectionTransaction).toHaveBeenCalledWith(1)
      expect(tx).toBeDefined()
      expect(tx.addSignature).toBeDefined()
    })
  })

  describe('dispatchTxProposal', () => {
    it('should NOT dispatch a tx proposal if tx is unsigned', async () => {
      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
      })

      const proposedTx = await dispatchTxProposal({ chainId: '4', safeAddress: '0x123', sender: '0x456', safeTx: tx })

      expect(proposeTx).toHaveBeenCalledWith('4', '0x123', '0x456', tx, '0x1234567890', undefined)
      expect(proposedTx).toEqual({ txId: '123' })

      expect(txEvents.txDispatch).not.toHaveBeenCalled()
    })

    it('should dispatch a PROPOSED event if tx is signed and has no id', async () => {
      const tx = createMockSafeTransaction({
        to: '0x123',
        data: '0x0',
      })
      tx.addSignature(generatePreValidatedSignature('0x1234567890123456789012345678901234567890'))

      const proposedTx = await dispatchTxProposal({ chainId: '4', safeAddress: '0x123', sender: '0x456', safeTx: tx })

      expect(proposeTx).toHaveBeenCalledWith('4', '0x123', '0x456', tx, '0x1234567890', undefined)
      expect(proposedTx).toEqual({ txId: '123' })

      expect(txEvents.txDispatch).toHaveBeenCalledWith('PROPOSED', { txId: '123', nonce: 0 })
    })

    it('should dispatch a SIGNATURE_PROPOSED event if tx has signatures and an id', async () => {
      const tx = createMockSafeTransaction({
        to: '0x123',
        data: '0x0',
      })
      tx.addSignature(generatePreValidatedSignature('0x1234567890123456789012345678901234567890'))

      const proposedTx = await dispatchTxProposal({
        chainId: '4',
        safeAddress: '0x123',
        sender: '0x456',
        safeTx: tx,
        txId: '345',
      })

      expect(proposeTx).toHaveBeenCalledWith('4', '0x123', '0x456', tx, '0x1234567890', undefined)
      expect(proposedTx).toEqual({ txId: '123' })

      expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGNATURE_PROPOSED', {
        txId: '123',
        signerAddress: '0x456',
        nonce: 0,
      })
    })

    it('should fail to propose a signature', async () => {
      ;(proposeTx as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('error')))

      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
      })

      await expect(
        dispatchTxProposal({ chainId: '4', safeAddress: '0x123', sender: '0x456', safeTx: tx, txId: '345' }),
      ).rejects.toThrow('error')

      expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGNATURE_PROPOSE_FAILED', {
        txId: '345',
        error: new Error('error'),
      })
    })

    it('should fail to propose a new tx', async () => {
      ;(proposeTx as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('error')))

      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
      })

      await expect(
        dispatchTxProposal({ chainId: '4', safeAddress: '0x123', sender: '0x456', safeTx: tx }),
      ).rejects.toThrow('error')

      expect(txEvents.txDispatch).toHaveBeenCalledWith('PROPOSE_FAILED', {
        error: new Error('error'),
      })
    })
  })

  describe('dispatchTxSigning', () => {
    it('should sign a tx', async () => {
      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
        nonce: 1,
      })

      const signedTx = await dispatchTxSigning(tx, '1.3.0', MockEip1193Provider, '0x345')

      expect(mockSafeSDK.createTransaction).toHaveBeenCalled()

      expect(mockSafeSDK.signTransaction).toHaveBeenCalledWith(expect.anything(), 'eth_signTypedData')
      expect(mockSafeSDK.signTransaction).not.toHaveBeenCalledWith(expect.anything(), 'eth_sign')

      expect(signedTx).not.toBe(tx)

      expect(txEvents.txDispatch).not.toHaveBeenCalledWith('SIGN_FAILED', { txId: '0x345', error: new Error('error') })
      expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGNED', { txId: '0x345' })
    })

    it('should only sign with `eth_signTypedData` on older Safes', async () => {
      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
        nonce: 1,
      })

      const signedTx = await dispatchTxSigning(tx, '1.0.0', MockEip1193Provider, '0x345')

      expect(mockSafeSDK.createTransaction).toHaveBeenCalledTimes(1)

      expect(mockSafeSDK.signTransaction).toHaveBeenCalledWith(expect.anything(), 'eth_signTypedData')
      expect(mockSafeSDK.signTransaction).not.toHaveBeenCalledWith(expect.anything(), 'eth_sign')

      expect(signedTx).not.toBe(tx)

      expect(txEvents.txDispatch).not.toHaveBeenCalledWith('SIGN_FAILED', { txId: '0x345', error: new Error('error') })
      expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGNED', { txId: '0x345' })
    })

    it("should only sign with `eth_signTypedData` for unsupported contracts (backend returns `SafeInfo['version']` as `null`)", async () => {
      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
        nonce: 1,
      })

      const signedTx = await dispatchTxSigning(tx, null, MockEip1193Provider, '0x345')

      expect(mockSafeSDK.createTransaction).toHaveBeenCalledTimes(1)

      expect(mockSafeSDK.signTransaction).toHaveBeenCalledWith(expect.anything(), 'eth_signTypedData')
      expect(mockSafeSDK.signTransaction).not.toHaveBeenCalledWith(expect.anything(), 'eth_sign')

      expect(signedTx).not.toBe(tx)

      expect(txEvents.txDispatch).not.toHaveBeenCalledWith('SIGN_FAILED', { txId: '0x345', error: new Error('error') })
      expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGNED', { txId: '0x345' })
    })

    it('should iterate over each signing method on newer Safes', async () => {
      ;(mockSafeSDK.signTransaction as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('error'))) // `eth_signTypedData` fails

      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
        nonce: 1,
      })

      const signedTx = await dispatchTxSigning(tx, '1.3.0', MockEip1193Provider, '0x345')

      expect(mockSafeSDK.createTransaction).toHaveBeenCalledTimes(1)

      expect(mockSafeSDK.signTransaction).toHaveBeenCalledWith(expect.anything(), 'eth_signTypedData')
      expect(mockSafeSDK.signTransaction).toHaveBeenCalledWith(expect.anything(), 'eth_sign')

      expect(signedTx).not.toBe(tx)

      expect(txEvents.txDispatch).not.toHaveBeenCalledWith('SIGN_FAILED', { txId: '0x345', error: new Error('error') })
      expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGNED', { txId: '0x345' })
    })

    it('should not iterate over the sequential signing method if the previous threw a rejection error', async () => {
      ;(mockSafeSDK.signTransaction as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('rejected'))) // `eth_signTypedData` fails

      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
        nonce: 1,
      })

      let signedTx

      try {
        signedTx = await dispatchTxSigning(tx, '1.3.0', MockEip1193Provider, '0x345')
      } catch (error) {
        expect(mockSafeSDK.createTransaction).toHaveBeenCalledTimes(1)

        expect(mockSafeSDK.signTransaction).toHaveBeenCalledWith(expect.anything(), 'eth_signTypedData')
        expect(mockSafeSDK.signTransaction).not.toHaveBeenCalledWith(expect.anything(), 'eth_sign')

        expect(signedTx).not.toBe(tx)

        expect((error as Error).message).toBe('rejected')

        expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGN_FAILED', {
          txId: '0x345',
          error,
        })
        expect(txEvents.txDispatch).not.toHaveBeenCalledWith('SIGNED', { txId: '0x345' })
      }
    })

    it('should throw the non-rejection error if it is the final signing method', async () => {
      ;(mockSafeSDK.signTransaction as jest.Mock)
        .mockImplementationOnce(() => Promise.reject(new Error('error'))) // `eth_signTypedData` fails
        .mockImplementationOnce(() => Promise.reject(new Error('failure-specific error'))) // `eth_sign` fails

      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
        nonce: 1,
      })

      let signedTx

      try {
        signedTx = await dispatchTxSigning(tx, '1.3.0', MockEip1193Provider, '0x345')
      } catch (error) {
        expect(mockSafeSDK.createTransaction).toHaveBeenCalledTimes(1)

        expect(mockSafeSDK.signTransaction).toHaveBeenCalledWith(expect.anything(), 'eth_signTypedData')
        expect(mockSafeSDK.signTransaction).toHaveBeenCalledWith(expect.anything(), 'eth_sign')

        expect(signedTx).not.toBe(tx)

        expect((error as Error).message).toBe('failure-specific error')

        expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGN_FAILED', {
          txId: '0x345',
          error,
        })
        expect(txEvents.txDispatch).not.toHaveBeenCalledWith('SIGNED', { txId: '0x345' })
      }
    })
  })

  describe('dispatchTxExecution', () => {
    it('should execute a tx', async () => {
      const simpleTxWatcherInstance = SimpleTxWatcher.getInstance()
      let watchTxHashSpy = jest.spyOn(simpleTxWatcherInstance, 'watchTxHash')
      watchTxHashSpy.mockImplementation(() => Promise.resolve({ status: 1 } as TransactionReceipt))

      const txId = 'tx_id_123'
      const safeAddress = toBeHex('0x123', 20)

      const safeTx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
        nonce: 1,
      })

      await dispatchTxExecution(safeTx, { nonce: 1 }, txId, MockEip1193Provider, SIGNER_ADDRESS, safeAddress, false)

      expect(mockSafeSDK.executeTransaction).toHaveBeenCalled()
      expect(txEvents.txDispatch).toHaveBeenCalledWith('EXECUTING', { txId, nonce: 1 })
      expect(txEvents.txDispatch).toHaveBeenCalledWith('PROCESSING', {
        nonce: 1,
        txId,
        signerAddress: SIGNER_ADDRESS,
        signerNonce: 1,
        txHash: TX_HASH,
        gasLimit: undefined,
        txType: 'SafeTx',
      })
    })

    it('should fail executing a tx', async () => {
      jest.spyOn(mockSafeSDK, 'executeTransaction').mockImplementationOnce(() => Promise.reject(new Error('error')))

      const txId = 'tx_id_123'
      const safeAddress = toBeHex('0x123', 20)

      const safeTx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
        nonce: 1,
      })

      await expect(dispatchTxExecution(safeTx, {}, txId, MockEip1193Provider, '5', safeAddress, false)).rejects.toThrow(
        'error',
      )

      expect(mockSafeSDK.executeTransaction).toHaveBeenCalled()
      expect(txEvents.txDispatch).toHaveBeenCalledWith('FAILED', { txId, error: new Error('error'), nonce: 1 })
    })

    it('should revert a tx', async () => {
      const simpleTxWatcherInstance = SimpleTxWatcher.getInstance()
      let watchTxHashSpy = jest.spyOn(simpleTxWatcherInstance, 'watchTxHash')
      watchTxHashSpy.mockImplementation(() => Promise.resolve({ status: 0 } as TransactionReceipt))
      const txId = 'tx_id_123'

      const safeTx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
        nonce: 1,
      })

      await dispatchTxExecution(safeTx, { nonce: 1 }, txId, MockEip1193Provider, SIGNER_ADDRESS, '0x123', false)

      expect(mockSafeSDK.executeTransaction).toHaveBeenCalled()
      expect(txEvents.txDispatch).toHaveBeenCalledWith('EXECUTING', { txId, nonce: 1 })
      expect(txEvents.txDispatch).toHaveBeenCalledWith('PROCESSING', {
        nonce: 1,
        txId,
        signerAddress: SIGNER_ADDRESS,
        signerNonce: 1,
        txHash: TX_HASH,
        txType: 'SafeTx',
        gasLimit: undefined,
      })
    })
  })

  describe('dispatchBatchExecutionRelay', () => {
    it('should relay a batch execution', async () => {
      const mockMultisendAddress = zeroPadValue('0x1234', 20)
      const safeAddress = toBeHex('0x567', 20)

      const txDetails1 = {
        txId: 'multisig_0x01',
        detailedExecutionInfo: {
          type: 'MULTISIG',
        },
      } as TransactionDetails

      const txDetails2 = {
        txId: 'multisig_0x02',
        detailedExecutionInfo: {
          type: 'MULTISIG',
        },
      } as TransactionDetails

      const txs = [txDetails1, txDetails2]

      const expectedData = '0xfefe'

      const multisendContractMock = {
        contract: {
          interface: {
            encodeFunctionData: jest.fn(() => expectedData),
          },
        } as any,
        getAddress: async () => mockMultisendAddress,
      } as MultiSendCallOnlyContractImplementationType

      jest
        .spyOn(safeContracts, 'getReadOnlyMultiSendCallOnlyContract')
        .mockImplementation(() => multisendContractMock as any)

      const mockData = {
        taskId: '0xdead1',
      }
      global.fetch = jest.fn().mockImplementationOnce(setupFetchStub(mockData))

      await dispatchBatchExecutionRelay(txs, multisendContractMock, '0x1234', '5', safeAddress, '1.3.0')

      expect(txEvents.txDispatch).toHaveBeenCalledWith('RELAYING', {
        txId: 'multisig_0x01',
        groupKey: '0x1234',
        taskId: '0xdead1',
      })
      expect(txEvents.txDispatch).toHaveBeenCalledWith('RELAYING', {
        txId: 'multisig_0x02',
        groupKey: '0x1234',
        taskId: '0xdead1',
      })
    })
  })
})
