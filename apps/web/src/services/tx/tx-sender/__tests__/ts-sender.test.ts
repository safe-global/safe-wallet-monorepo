import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import type Safe from '@safe-global/protocol-kit'
import type { MultiSendCallOnlyContractImplementationType } from '@safe-global/protocol-kit'
import extractTxInfo from '../../extractTxInfo'
import * as txEvents from '../../txEvents'
import {
  createTx,
  createExistingTx,
  createRejectTx,
  dispatchOnChainSigning,
  dispatchTxExecution,
  dispatchTxProposal,
  dispatchTxSigning,
  dispatchBatchExecutionRelay,
  dispatchTxRelay,
} from '..'
import * as sdk from '../sdk'
import {
  BrowserProvider,
  concat,
  type TransactionReceipt,
  zeroPadValue,
  type JsonRpcProvider,
  type JsonRpcSigner,
} from 'ethers'
import { encodeNestedTxPayload } from '../../nestedTxEnvelope'
import * as safeContracts from '@/services/contracts/safeContracts'

import * as web3 from '@/hooks/wallets/web3'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { toBeHex } from 'ethers'
import { generatePreValidatedSignature } from '@safe-global/protocol-kit'
import { createMockSafeTransaction } from '@/tests/transactions'
import { MockEip1193Provider } from '@/tests/mocks/providers'
import { SimpleTxWatcher } from '@/utils/SimpleTxWatcher'

const SIGNER_ADDRESS = '0x1234567890123456789012345678901234567890'
const TX_HASH = '0x1234567890'

// Mock extractTxInfo
jest.mock('../../extractTxInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    txParams: {},
    signatures: [],
  })),
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

    // Initialize store for tests that need it (e.g., dispatchBatchExecutionRelay)
    const { makeStore, setStoreInstance } = require('@/store')
    const testStore = makeStore({}, { skipBroadcast: true })
    setStoreInstance(testStore)
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
      const tx = await createExistingTx('4', '0x345')

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
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/4/transactions/0x123/propose`, () => {
          return HttpResponse.json({
            txId: '123',
            txInfo: {
              type: 'Custom',
              to: { value: '0x123' },
              dataSize: '100',
              isCancellation: false,
            },
            timestamp: Date.now(),
            txStatus: 'AWAITING_CONFIRMATIONS',
          })
        }),
      )

      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
      })

      const proposedTx = await dispatchTxProposal({ chainId: '4', safeAddress: '0x123', sender: '0x456', safeTx: tx })

      expect(proposedTx).toEqual({
        txId: '123',
        txInfo: expect.any(Object),
        timestamp: expect.any(Number),
        txStatus: 'AWAITING_CONFIRMATIONS',
      })

      expect(txEvents.txDispatch).not.toHaveBeenCalled()
    })

    it('should dispatch a PROPOSED event if tx is signed and has no id', async () => {
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/4/transactions/0x123/propose`, () => {
          return HttpResponse.json({
            txId: '123',
            txInfo: {
              type: 'Custom',
              to: { value: '0x123' },
              dataSize: '100',
              isCancellation: false,
            },
            timestamp: Date.now(),
            txStatus: 'AWAITING_CONFIRMATIONS',
          })
        }),
      )

      const tx = createMockSafeTransaction({
        to: '0x123',
        data: '0x0',
      })
      tx.addSignature(generatePreValidatedSignature('0x1234567890123456789012345678901234567890'))

      const proposedTx = await dispatchTxProposal({ chainId: '4', safeAddress: '0x123', sender: '0x456', safeTx: tx })

      expect(proposedTx.txId).toBe('123')

      expect(txEvents.txDispatch).toHaveBeenCalledWith('PROPOSED', {
        txId: '123',
        nonce: 0,
        signerAddress: undefined,
        chainId: '4',
        safeAddress: '0x123',
      })
    })

    it('should dispatch a SIGNATURE_PROPOSED event if tx has signatures and an id', async () => {
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/4/transactions/0x123/propose`, () => {
          return HttpResponse.json({
            txId: '123',
            txInfo: {
              type: 'Custom',
              to: { value: '0x123' },
              dataSize: '100',
              isCancellation: false,
            },
            timestamp: Date.now(),
            txStatus: 'AWAITING_CONFIRMATIONS',
          })
        }),
      )

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

      expect(proposedTx.txId).toBe('123')

      expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGNATURE_PROPOSED', {
        txId: '123',
        signerAddress: '0x456',
        nonce: 0,
        chainId: '4',
        safeAddress: '0x123',
      })
    })

    it('should fail to propose a signature', async () => {
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/4/transactions/0x123/propose`, () => {
          return HttpResponse.json({ message: 'Invalid transaction' }, { status: 400 })
        }),
      )

      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
      })

      await expect(
        dispatchTxProposal({ chainId: '4', safeAddress: '0x123', sender: '0x456', safeTx: tx, txId: '345' }),
      ).rejects.toThrow()

      expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGNATURE_PROPOSE_FAILED', {
        txId: '345',
        error: expect.any(Error),
        chainId: '4',
        safeAddress: '0x123',
      })
    })

    it('should fail to propose a new tx', async () => {
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/4/transactions/0x123/propose`, () => {
          return HttpResponse.json({ message: 'Invalid transaction' }, { status: 400 })
        }),
      )

      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
      })

      await expect(
        dispatchTxProposal({ chainId: '4', safeAddress: '0x123', sender: '0x456', safeTx: tx }),
      ).rejects.toThrow()

      expect(txEvents.txDispatch).toHaveBeenCalledWith('PROPOSE_FAILED', {
        error: expect.any(Error),
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

      const signedTx = await dispatchTxSigning(tx, MockEip1193Provider, '0x345')

      expect(mockSafeSDK.createTransaction).toHaveBeenCalled()

      expect(mockSafeSDK.signTransaction).toHaveBeenCalledWith(expect.anything(), 'eth_signTypedData')

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

      const signedTx = await dispatchTxSigning(tx, MockEip1193Provider, '0x345')

      expect(mockSafeSDK.createTransaction).toHaveBeenCalledTimes(1)

      expect(mockSafeSDK.signTransaction).toHaveBeenCalledWith(expect.anything(), 'eth_signTypedData')

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

      const signedTx = await dispatchTxSigning(tx, MockEip1193Provider, '0x345')

      expect(mockSafeSDK.createTransaction).toHaveBeenCalledTimes(1)

      expect(mockSafeSDK.signTransaction).toHaveBeenCalledWith(expect.anything(), 'eth_signTypedData')

      expect(signedTx).not.toBe(tx)

      expect(txEvents.txDispatch).not.toHaveBeenCalledWith('SIGN_FAILED', { txId: '0x345', error: new Error('error') })
      expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGNED', { txId: '0x345' })
    })

    it('should throw the non-rejection error if it is the final signing method', async () => {
      ;(mockSafeSDK.signTransaction as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error('failure-specific error')),
      ) // `eth_signTypedData` fails

      const tx = await createTx({
        to: '0x123',
        value: '1',
        data: '0x0',
        nonce: 1,
      })

      let signedTx

      try {
        signedTx = await dispatchTxSigning(tx, MockEip1193Provider, '0x345')
      } catch (error) {
        expect(mockSafeSDK.createTransaction).toHaveBeenCalledTimes(1)

        expect(mockSafeSDK.signTransaction).toHaveBeenCalledWith(expect.anything(), 'eth_signTypedData')

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

      await dispatchTxExecution(
        '1',
        safeTx,
        { nonce: 1 },
        txId,
        MockEip1193Provider,
        SIGNER_ADDRESS,
        safeAddress,
        false,
        true,
      )

      expect(mockSafeSDK.executeTransaction).toHaveBeenCalled()
      expect(txEvents.txDispatch).toHaveBeenCalledWith('EXECUTING', {
        txId,
        nonce: 1,
        chainId: '1',
        safeAddress,
      })
      expect(txEvents.txDispatch).toHaveBeenCalledWith('PROCESSING', {
        nonce: 1,
        txId,
        signerAddress: SIGNER_ADDRESS,
        signerNonce: 1,
        txHash: TX_HASH,
        gasLimit: undefined,
        txType: 'SafeTx',
        chainId: '1',
        safeAddress,
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

      await expect(
        dispatchTxExecution('1', safeTx, {}, txId, MockEip1193Provider, '5', safeAddress, false, true),
      ).rejects.toThrow('error')

      expect(mockSafeSDK.executeTransaction).toHaveBeenCalled()
      expect(txEvents.txDispatch).toHaveBeenCalledWith('FAILED', {
        txId,
        error: new Error('error'),
        nonce: 1,
        chainId: '1',
        safeAddress,
      })
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

      await dispatchTxExecution(
        '1',
        safeTx,
        { nonce: 1 },
        txId,
        MockEip1193Provider,
        SIGNER_ADDRESS,
        '0x123',
        false,
        true,
      )

      expect(mockSafeSDK.executeTransaction).toHaveBeenCalled()
      expect(txEvents.txDispatch).toHaveBeenCalledWith('EXECUTING', {
        txId,
        nonce: 1,
        chainId: '1',
        safeAddress: '0x123',
      })
      expect(txEvents.txDispatch).toHaveBeenCalledWith('PROCESSING', {
        nonce: 1,
        txId,
        signerAddress: SIGNER_ADDRESS,
        signerNonce: 1,
        txHash: TX_HASH,
        txType: 'SafeTx',
        gasLimit: undefined,
        chainId: '1',
        safeAddress: '0x123',
      })
    })
  })

  describe('dispatchTxRelay', () => {
    it('passes the computed safeTxHash to the relay endpoint', async () => {
      const safeAddress = toBeHex('0x789', 20)
      const safeTx = createMockSafeTransaction({
        to: safeAddress,
        data: '0x',
        value: '0',
        operation: 0,
      })
      const safe = {
        address: { value: safeAddress },
        chainId: '5',
        version: '1.3.0',
      } as unknown as Parameters<typeof dispatchTxRelay>[1]
      const chain = {} as unknown as Parameters<typeof dispatchTxRelay>[3]

      jest.spyOn(safeContracts, 'getReadOnlyCurrentGnosisSafeContract').mockResolvedValue({
        encode: jest.fn(() => '0xabcd'),
      } as any)

      let receivedBody: any
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/5/relay`, async ({ request }) => {
          receivedBody = await request.json()
          return HttpResponse.json({ taskId: '0xtask' })
        }),
      )

      await dispatchTxRelay(safeTx, safe, 'multisig_0x1', chain)

      expect(receivedBody.safeTxHash).toBe('0x1234567890')
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
        encode: jest.fn(() => expectedData),
        getAddress: () => mockMultisendAddress,
      } as unknown as MultiSendCallOnlyContractImplementationType

      jest
        .spyOn(safeContracts, 'getReadOnlyMultiSendCallOnlyContract')
        .mockImplementation(() => multisendContractMock as any)

      const mockTaskId = '0xdead1'

      // Setup MSW handler for relay endpoint
      server.use(
        http.post(`${GATEWAY_URL}/v1/chains/5/relay`, () => {
          return HttpResponse.json({ taskId: mockTaskId })
        }),
      )

      await dispatchBatchExecutionRelay(txs, multisendContractMock, '0x1234', '5', safeAddress, '1.3.0')

      expect(txEvents.txDispatch).toHaveBeenCalledWith('RELAYING', {
        txId: 'multisig_0x01',
        groupKey: '0x1234',
        taskId: mockTaskId,
        chainId: '5',
        safeAddress,
      })
      expect(txEvents.txDispatch).toHaveBeenCalledWith('RELAYING', {
        txId: 'multisig_0x02',
        groupKey: '0x1234',
        taskId: mockTaskId,
        chainId: '5',
        safeAddress,
      })
    })
  })

  describe('nested Safe signing/execution', () => {
    const PARENT_SAFE = toBeHex('0xabc', 20)
    const CHILD_SAFE = toBeHex('0xdef', 20)

    it('dispatchOnChainSigning emits NESTED_SAFE_TX_CREATED with executed=false when the parent only queues the approveHash', async () => {
      jest.spyOn(sdk, 'prepareApproveTxHash').mockResolvedValue('0xapprovehashdata')
      const parentSafeTxHash = zeroPadValue('0x01', 32)
      ;(MockEip1193Provider.request as jest.Mock).mockResolvedValue(parentSafeTxHash)

      const safeTx = await createTx({ to: '0x123', value: '1', data: '0x0', nonce: 1 })

      await dispatchOnChainSigning(safeTx, 'tx_id_123', MockEip1193Provider, '1', PARENT_SAFE, CHILD_SAFE, true, false)

      expect(txEvents.txDispatch).toHaveBeenCalledWith(
        'NESTED_SAFE_TX_CREATED',
        expect.objectContaining({
          txId: 'tx_id_123',
          txHashOrParentSafeTxHash: parentSafeTxHash,
          parentSafeAddress: PARENT_SAFE,
          executed: false,
          method: 'approveHash',
        }),
      )
    })

    it('dispatchOnChainSigning emits NESTED_SAFE_TX_CREATED with executed=true when the parent executes immediately', async () => {
      jest.spyOn(sdk, 'prepareApproveTxHash').mockResolvedValue('0xapprovehashdata')
      const onChainTxHash = zeroPadValue('0x02', 32)
      ;(MockEip1193Provider.request as jest.Mock).mockResolvedValue(onChainTxHash)

      const safeTx = await createTx({ to: '0x123', value: '1', data: '0x0', nonce: 1 })

      await dispatchOnChainSigning(safeTx, 'tx_id_123', MockEip1193Provider, '1', PARENT_SAFE, CHILD_SAFE, true, true)

      expect(txEvents.txDispatch).toHaveBeenCalledWith(
        'NESTED_SAFE_TX_CREATED',
        expect.objectContaining({
          txHashOrParentSafeTxHash: onChainTxHash,
          parentSafeAddress: PARENT_SAFE,
          executed: true,
        }),
      )
    })

    it('dispatchOnChainSigning does NOT emit NESTED_SAFE_TX_CREATED for a non-Safe smart-account signer', async () => {
      jest.spyOn(sdk, 'prepareApproveTxHash').mockResolvedValue('0xapprovehashdata')
      ;(MockEip1193Provider.request as jest.Mock).mockResolvedValue(zeroPadValue('0x05', 32))

      const safeTx = await createTx({ to: '0x123', value: '1', data: '0x0', nonce: 1 })

      // isSafeSigner = false → non-Safe smart account (e.g. Argent/AA): keeps the plain flow.
      await dispatchOnChainSigning(safeTx, 'tx_id_123', MockEip1193Provider, '1', PARENT_SAFE, CHILD_SAFE, false, false)

      expect(txEvents.txDispatch).toHaveBeenCalledWith('ONCHAIN_SIGNATURE_SUCCESS', expect.anything())
      expect(txEvents.txDispatch).not.toHaveBeenCalledWith('NESTED_SAFE_TX_CREATED', expect.anything())
    })

    it('dispatchTxExecution emits NESTED_SAFE_TX_CREATED instead of PROCESSING when a smart-account executor only queues the execTransaction', async () => {
      jest.spyOn(sdk, 'prepareTxExecution').mockResolvedValue('0xexecdata')
      const parentSafeTxHash = zeroPadValue('0x03', 32)
      ;(MockEip1193Provider.request as jest.Mock).mockResolvedValue(parentSafeTxHash)

      const safeTx = await createTx({ to: '0x123', value: '1', data: '0x0', nonce: 1 })

      await dispatchTxExecution(
        '1',
        safeTx,
        { nonce: 1 },
        'tx_id_123',
        MockEip1193Provider,
        PARENT_SAFE,
        CHILD_SAFE,
        true, // isSmartAccount
        false, // executed
      )

      expect(txEvents.txDispatch).toHaveBeenCalledWith(
        'NESTED_SAFE_TX_CREATED',
        expect.objectContaining({
          txHashOrParentSafeTxHash: parentSafeTxHash,
          parentSafeAddress: PARENT_SAFE,
          executed: false,
          method: 'execTransaction',
        }),
      )
      expect(txEvents.txDispatch).not.toHaveBeenCalledWith('PROCESSING', expect.anything())
      expect(txEvents.txDispatch).not.toHaveBeenCalledWith('EXECUTING', expect.anything())
    })

    describe('nested tx envelope appending', () => {
      const APPROVE_HASH_CALLDATA = concat(['0xd4d9bdcd', zeroPadValue('0x0badc0de', 32)])

      const buildSafeTx = () => createMockSafeTransaction({ to: toBeHex('0x123', 20), data: '0xabcdef', value: '1' })

      const getSentData = (): string => (MockEip1193Provider.request as jest.Mock).mock.calls[0][0].params[0].data

      beforeEach(() => {
        jest.spyOn(sdk, 'prepareApproveTxHash').mockResolvedValue(APPROVE_HASH_CALLDATA)
        ;(MockEip1193Provider.request as jest.Mock).mockResolvedValue(zeroPadValue('0x01', 32))
      })

      it('appends the child tx envelope for a Safe signer when the child Safe is >= 1.3.0', async () => {
        const safeTx = buildSafeTx()

        await dispatchOnChainSigning(
          safeTx,
          'tx_id_123',
          MockEip1193Provider,
          '1',
          PARENT_SAFE,
          CHILD_SAFE,
          true,
          false,
          '1.3.0',
        )

        const expectedPayload = encodeNestedTxPayload([{ chainId: '1', safe: CHILD_SAFE, ...safeTx.data }])
        expect(getSentData()).toBe(concat([APPROVE_HASH_CALLDATA, expectedPayload]))
      })

      it('keeps plain 36-byte calldata for a non-Safe smart-account signer', async () => {
        await dispatchOnChainSigning(
          buildSafeTx(),
          'tx_id_123',
          MockEip1193Provider,
          '1',
          PARENT_SAFE,
          CHILD_SAFE,
          false,
          false,
          '1.4.1',
        )

        expect(getSentData()).toBe(APPROVE_HASH_CALLDATA)
      })

      it('keeps plain calldata when the child Safe is < 1.3.0', async () => {
        await dispatchOnChainSigning(
          buildSafeTx(),
          'tx_id_123',
          MockEip1193Provider,
          '1',
          PARENT_SAFE,
          CHILD_SAFE,
          true,
          false,
          '1.1.1',
        )

        expect(getSentData()).toBe(APPROVE_HASH_CALLDATA)
      })

      it('keeps plain calldata when the child Safe version is unknown', async () => {
        await dispatchOnChainSigning(
          buildSafeTx(),
          'tx_id_123',
          MockEip1193Provider,
          '1',
          PARENT_SAFE,
          CHILD_SAFE,
          true,
          false,
          null,
        )

        expect(getSentData()).toBe(APPROVE_HASH_CALLDATA)
      })
    })
  })
})
