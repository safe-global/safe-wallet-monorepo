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
  dispatchTxConfirmation,
  dispatchTxExecution,
  dispatchTxProposal,
  dispatchTxSigning,
  dispatchBatchExecutionRelay,
  dispatchTxRelay,
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

      expect(txEvents.txDispatch).toHaveBeenCalledWith('PROPOSED', { txId: '123', nonce: 0 })
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

  describe('dispatchTxConfirmation', () => {
    const SAFE_ADDRESS = '0x123'
    const OTHER_SIGNER = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    const TX_ID = `multisig_${SAFE_ADDRESS}_${TX_HASH}`
    const CONFIRMATIONS_URL = `${GATEWAY_URL}/v1/chains/4/transactions/${TX_HASH}/confirmations`
    const PROPOSE_URL = `${GATEWAY_URL}/v1/chains/4/transactions/${SAFE_ADDRESS}/propose`

    const confirmationResponse = {
      id: TX_ID,
      txHash: null,
      timestamp: Date.now(),
      txStatus: 'AWAITING_CONFIRMATIONS',
      txInfo: { type: 'Custom', to: { value: '0x123' }, dataSize: '100', isCancellation: false },
      executionInfo: { type: 'MULTISIG', nonce: 0, confirmationsRequired: 3, confirmationsSubmitted: 2 },
    }

    const createSignedTx = (...signers: string[]) => {
      const tx = createMockSafeTransaction({ to: '0x123', data: '0x0' })
      signers.forEach((signer) => tx.addSignature(generatePreValidatedSignature(signer)))
      return tx
    }

    it('should send the signature to the confirmations endpoint and dispatch SIGNATURE_PROPOSED', async () => {
      const proposeHandler = jest.fn()
      let capturedBody: unknown

      server.use(
        http.post(CONFIRMATIONS_URL, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json(confirmationResponse)
        }),
        http.post(PROPOSE_URL, () => {
          proposeHandler()
          return HttpResponse.json({ txId: TX_ID })
        }),
      )

      const tx = createSignedTx(OTHER_SIGNER, SIGNER_ADDRESS)

      const confirmedTx = await dispatchTxConfirmation({
        chainId: '4',
        safeAddress: SAFE_ADDRESS,
        sender: SIGNER_ADDRESS,
        safeTx: tx,
        txId: TX_ID,
      })

      expect(confirmedTx).toEqual(confirmationResponse)
      expect(capturedBody).toEqual({ signature: generatePreValidatedSignature(SIGNER_ADDRESS).data })
      expect(proposeHandler).not.toHaveBeenCalled()
      expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGNATURE_PROPOSED', {
        txId: TX_ID,
        signerAddress: SIGNER_ADDRESS,
        nonce: 0,
        chainId: '4',
        safeAddress: SAFE_ADDRESS,
      })
    })

    it('should look up the signature by sender regardless of address casing', async () => {
      let capturedBody: unknown
      server.use(
        http.post(CONFIRMATIONS_URL, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json(confirmationResponse)
        }),
      )

      await dispatchTxConfirmation({
        chainId: '4',
        safeAddress: SAFE_ADDRESS,
        sender: OTHER_SIGNER.toUpperCase().replace('0X', '0x'),
        safeTx: createSignedTx(OTHER_SIGNER),
        txId: TX_ID,
      })

      expect(capturedBody).toEqual({ signature: generatePreValidatedSignature(OTHER_SIGNER).data })
    })

    it('should add each subsequent signature as a confirmation without re-proposing', async () => {
      const proposeHandler = jest.fn()
      const capturedBodies: unknown[] = []

      server.use(
        http.post(CONFIRMATIONS_URL, async ({ request }) => {
          capturedBodies.push(await request.json())
          return HttpResponse.json({
            ...confirmationResponse,
            executionInfo: { ...confirmationResponse.executionInfo, confirmationsSubmitted: capturedBodies.length + 1 },
          })
        }),
        http.post(PROPOSE_URL, () => {
          proposeHandler()
          return HttpResponse.json({ txId: TX_ID })
        }),
      )

      const tx = createSignedTx(SIGNER_ADDRESS)

      tx.addSignature(generatePreValidatedSignature(OTHER_SIGNER))
      await dispatchTxConfirmation({
        chainId: '4',
        safeAddress: SAFE_ADDRESS,
        sender: OTHER_SIGNER,
        safeTx: tx,
        txId: TX_ID,
      })

      const THIRD_SIGNER = '0x9999999999999999999999999999999999999999'
      tx.addSignature(generatePreValidatedSignature(THIRD_SIGNER))
      await dispatchTxConfirmation({
        chainId: '4',
        safeAddress: SAFE_ADDRESS,
        sender: THIRD_SIGNER,
        safeTx: tx,
        txId: TX_ID,
      })

      expect(proposeHandler).not.toHaveBeenCalled()
      expect(capturedBodies).toEqual([
        { signature: generatePreValidatedSignature(OTHER_SIGNER).data },
        { signature: generatePreValidatedSignature(THIRD_SIGNER).data },
      ])
      expect(txEvents.txDispatch).toHaveBeenCalledTimes(2)
      expect(txEvents.txDispatch).toHaveBeenNthCalledWith(
        1,
        'SIGNATURE_PROPOSED',
        expect.objectContaining({ signerAddress: OTHER_SIGNER }),
      )
      expect(txEvents.txDispatch).toHaveBeenNthCalledWith(
        2,
        'SIGNATURE_PROPOSED',
        expect.objectContaining({ signerAddress: THIRD_SIGNER }),
      )
    })

    it('should dispatch SIGNATURE_PROPOSE_FAILED when the gateway rejects the confirmation', async () => {
      server.use(
        http.post(CONFIRMATIONS_URL, () => HttpResponse.json({ message: 'Invalid signature' }, { status: 422 })),
      )

      await expect(
        dispatchTxConfirmation({
          chainId: '4',
          safeAddress: SAFE_ADDRESS,
          sender: SIGNER_ADDRESS,
          safeTx: createSignedTx(SIGNER_ADDRESS),
          txId: TX_ID,
        }),
      ).rejects.toThrow('Invalid signature')

      expect(txEvents.txDispatch).toHaveBeenCalledWith('SIGNATURE_PROPOSE_FAILED', {
        txId: TX_ID,
        error: expect.any(Error),
        chainId: '4',
        safeAddress: SAFE_ADDRESS,
      })
      expect(txEvents.txDispatch).not.toHaveBeenCalledWith('SIGNATURE_PROPOSED', expect.anything())
    })

    it('should fail without calling the gateway when the sender has not signed', async () => {
      const confirmationsHandler = jest.fn()
      server.use(
        http.post(CONFIRMATIONS_URL, () => {
          confirmationsHandler()
          return HttpResponse.json(confirmationResponse)
        }),
      )

      await expect(
        dispatchTxConfirmation({
          chainId: '4',
          safeAddress: SAFE_ADDRESS,
          sender: SIGNER_ADDRESS,
          safeTx: createSignedTx(OTHER_SIGNER),
          txId: TX_ID,
        }),
      ).rejects.toThrow(`No signature from ${SIGNER_ADDRESS} found on transaction ${TX_ID}`)

      expect(confirmationsHandler).not.toHaveBeenCalled()
      expect(txEvents.txDispatch).toHaveBeenCalledWith(
        'SIGNATURE_PROPOSE_FAILED',
        expect.objectContaining({ txId: TX_ID }),
      )
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
        dispatchTxExecution('1', safeTx, {}, txId, MockEip1193Provider, '5', safeAddress, false),
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

      await dispatchTxExecution('1', safeTx, { nonce: 1 }, txId, MockEip1193Provider, SIGNER_ADDRESS, '0x123', false)

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
})
