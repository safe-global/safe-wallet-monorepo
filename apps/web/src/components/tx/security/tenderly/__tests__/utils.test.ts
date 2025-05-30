import type { MetaTransactionData, SafeTransaction } from '@safe-global/types-kit'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { zeroPadValue, Interface } from 'ethers'
import { getSimulationPayload } from '@/components/tx/security/tenderly/utils'
import * as safeContracts from '@/services/contracts/safeContracts'
import { getMultiSendCallOnlyDeployment, getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import EthSafeTransaction from '@safe-global/protocol-kit/dist/src/utils/transactions/SafeTransaction'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { generatePreValidatedSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'
import { toBeHex } from 'ethers'
import * as Web3 from '@/hooks/wallets/web3'
import {
  NONCE_STORAGE_POSITION,
  THRESHOLD_STORAGE_POSITION,
} from '@safe-global/utils/components/tx/security/tenderly/utils'

const SIGNATURE_LENGTH = 65 * 2

const getPreValidatedSignature = (addr: string): string => generatePreValidatedSignature(addr).data

describe('simulation utils', () => {
  const safeContractInterface = new Interface(getSafeSingletonDeployment({ version: '1.3.0' })?.abi || [])
  const multiSendContractInterface = new Interface(getMultiSendCallOnlyDeployment({ version: '1.3.0' })?.abi || [])
  const mockSafeAddress = zeroPadValue('0x0123', 20)
  const mockMultisendAddress = zeroPadValue('0x1234', 20)

  beforeAll(() => {
    const safeContractMock = {
      encode: (functionFragment: string, values: readonly any[]) =>
        safeContractInterface.encodeFunctionData(functionFragment, values),
      getAddress: () => mockSafeAddress,
    }
    const multisendContractMock = {
      encode: (functionFragment: string, values: readonly any[]) =>
        multiSendContractInterface.encodeFunctionData(functionFragment, values),
      getAddress: () => mockMultisendAddress,
    }
    jest.spyOn(safeContracts, 'getReadOnlyCurrentGnosisSafeContract').mockImplementation(() => safeContractMock as any)
    jest
      .spyOn(safeContracts, 'getReadOnlyMultiSendCallOnlyContract')
      .mockImplementation(() => multisendContractMock as any)

    jest.spyOn(Web3, 'getWeb3ReadOnly').mockImplementation(
      () =>
        ({
          getBlock: () =>
            Promise.resolve({
              gasLimit: BigInt(30_000_000),
            }),
        }) as any,
    )
  })
  describe('getSimulationPayload', () => {
    it('unsigned executable multisig transaction with threshold 1', async () => {
      const ownerAddress = zeroPadValue('0x01', 20)
      const mockSafeInfo: Partial<SafeInfo> = {
        threshold: 1,
        nonce: 0,
        chainId: '4',
        address: { value: zeroPadValue('0x0123', 20) },
      }
      const mockTx: SafeTransaction = new EthSafeTransaction({
        to: ZERO_ADDRESS,
        value: '0x0',
        data: '0x',
        baseGas: '0',
        gasPrice: '0',
        gasToken: ZERO_ADDRESS,
        nonce: 0,
        operation: 0,
        refundReceiver: ZERO_ADDRESS,
        safeTxGas: '0',
      })

      const tenderlyPayload = await getSimulationPayload({
        executionOwner: ownerAddress,
        gasLimit: 50_000,
        safe: mockSafeInfo as SafeInfo,
        transactions: mockTx,
      })

      /* Decode the call params:
        [0] address to,
        [1] uint256 value,
        [2] bytes calldata data,
        [3] Enum.Operation operation,
        [4] uint256 safeTxGas,
        [5] uint256 baseGas,
        [6] uint256 gasPrice,
        [7] address gasToken,
        [8] address payable refundReceiver,
        [9] bytes memory signatures
       */
      const decodedTxData = safeContractInterface.decodeFunctionData('execTransaction', tenderlyPayload.input)

      expect(tenderlyPayload.to).toEqual(mockSafeAddress)
      expect(decodedTxData[0]).toEqual(ZERO_ADDRESS)
      expect(decodedTxData[1]).toEqual(BigInt(0))
      expect(decodedTxData[2]).toEqual('0x')
      expect(decodedTxData[3]).toEqual(0n)
      expect(decodedTxData[4]).toEqual(BigInt(0))
      expect(decodedTxData[5]).toEqual(BigInt(0))
      expect(decodedTxData[6]).toEqual(BigInt(0))
      expect(decodedTxData[7]).toEqual(ZERO_ADDRESS)
      expect(decodedTxData[8]).toEqual(ZERO_ADDRESS)

      expect(tenderlyPayload.gas).toEqual(50_000)

      // Add prevalidated signature of connected owner
      expect(decodedTxData[9]).toContain(getPreValidatedSignature(ownerAddress))

      // Do not overwrite the threshold
      expect(tenderlyPayload.state_objects).toBeUndefined()
    })

    it('fully signed executable multisig transaction with threshold 2', async () => {
      const ownerAddress = zeroPadValue('0x01', 20)
      const otherOwnerAddress1 = zeroPadValue('0x11', 20)
      const otherOwnerAddress2 = zeroPadValue('0x12', 20)

      const mockSafeInfo: Partial<SafeInfo> = {
        threshold: 2,
        nonce: 0,
        chainId: '4',
        address: { value: zeroPadValue('0x0123', 20) },
      }
      const mockTx: SafeTransaction = new EthSafeTransaction({
        to: ZERO_ADDRESS,
        value: '0x0',
        data: '0x',
        baseGas: '0',
        gasPrice: '0',
        gasToken: ZERO_ADDRESS,
        nonce: 0,
        operation: 0,
        refundReceiver: ZERO_ADDRESS,
        safeTxGas: '0',
      })

      mockTx.addSignature(generatePreValidatedSignature(otherOwnerAddress1))
      mockTx.addSignature(generatePreValidatedSignature(otherOwnerAddress2))

      const tenderlyPayload = await getSimulationPayload({
        executionOwner: ownerAddress,
        gasLimit: 50_000,
        safe: mockSafeInfo as SafeInfo,
        transactions: mockTx,
      })

      const decodedTxData = safeContractInterface.decodeFunctionData('execTransaction', tenderlyPayload.input)

      // Do not add preValidatedSignature of connected owner as the tx is fully signed
      expect(decodedTxData[9]).not.toContain(getPreValidatedSignature(ownerAddress))
      // Do not overwrite the threshold
      expect(tenderlyPayload.state_objects).toBeUndefined()
    })

    it('partially signed multisig transaction with threshold 2 and higher nonce', async () => {
      const ownerAddress = zeroPadValue('0x01', 20)
      const otherOwnerAddress1 = zeroPadValue('0x11', 20)

      const mockSafeInfo: Partial<SafeInfo> = {
        threshold: 2,
        nonce: 0,
        chainId: '4',
        address: { value: zeroPadValue('0x0123', 20) },
      }
      const mockTx: SafeTransaction = new EthSafeTransaction({
        to: ZERO_ADDRESS,
        value: '0x0',
        data: '0x',
        baseGas: '0',
        gasPrice: '0',
        gasToken: ZERO_ADDRESS,
        nonce: 1,
        operation: 0,
        refundReceiver: ZERO_ADDRESS,
        safeTxGas: '0',
      })

      mockTx.addSignature(generatePreValidatedSignature(otherOwnerAddress1))

      const tenderlyPayload = await getSimulationPayload({
        executionOwner: ownerAddress,
        safe: mockSafeInfo as SafeInfo,
        transactions: mockTx,
      })

      const decodedTxData = safeContractInterface.decodeFunctionData('execTransaction', tenderlyPayload.input)

      // Do add preValidatedSignature of connected owner as the tx is only partially signed
      expect(decodedTxData[9]).toContain(getPreValidatedSignature(ownerAddress))
      expect(decodedTxData[9]).toHaveLength(SIGNATURE_LENGTH * 2 + 2)
      // Do  overwrite the nonce but not the threshold
      expect(tenderlyPayload.state_objects).toBeDefined()
      const safeOverwrite = tenderlyPayload.state_objects![mockSafeAddress]
      expect(safeOverwrite?.storage).toBeDefined()
      expect(safeOverwrite.storage![NONCE_STORAGE_POSITION]).toBe(toBeHex('0x1', 32))
      expect(safeOverwrite.storage![THRESHOLD_STORAGE_POSITION]).toBeUndefined()
    })

    it('partially signed executable multisig transaction with threshold 2 and matching nonce', async () => {
      const ownerAddress = zeroPadValue('0x01', 20)
      const otherOwnerAddress1 = zeroPadValue('0x11', 20)

      const mockSafeInfo: Partial<SafeInfo> = {
        threshold: 2,
        nonce: 0,
        chainId: '4',
        address: { value: zeroPadValue('0x0123', 20) },
      }
      const mockTx: SafeTransaction = new EthSafeTransaction({
        to: ZERO_ADDRESS,
        value: '0x0',
        data: '0x',
        baseGas: '0',
        gasPrice: '0',
        gasToken: ZERO_ADDRESS,
        nonce: 0,
        operation: 0,
        refundReceiver: ZERO_ADDRESS,
        safeTxGas: '0',
      })

      mockTx.addSignature(generatePreValidatedSignature(otherOwnerAddress1))

      const tenderlyPayload = await getSimulationPayload({
        executionOwner: ownerAddress,
        gasLimit: 50_000,
        safe: mockSafeInfo as SafeInfo,
        transactions: mockTx,
      })

      const decodedTxData = safeContractInterface.decodeFunctionData('execTransaction', tenderlyPayload.input)

      // Do add preValidatedSignature of connected owner as the tx is only partially signed
      expect(decodedTxData[9]).toContain(getPreValidatedSignature(ownerAddress))
      expect(decodedTxData[9]).toHaveLength(SIGNATURE_LENGTH * 2 + 2)
      // Do not overwrite the threshold
      expect(tenderlyPayload.state_objects).toBeUndefined()
    })

    it('unsigned signed not-executable multisig transaction with threshold 2', async () => {
      const ownerAddress = zeroPadValue('0x01', 20)

      const mockSafeInfo: Partial<SafeInfo> = {
        threshold: 2,
        nonce: 0,
        chainId: '4',
        address: { value: zeroPadValue('0x0123', 20) },
      }
      const mockTx: SafeTransaction = new EthSafeTransaction({
        to: ZERO_ADDRESS,
        value: '0x0',
        data: '0x',
        baseGas: '0',
        gasPrice: '0',
        gasToken: ZERO_ADDRESS,
        nonce: 0,
        operation: 0,
        refundReceiver: ZERO_ADDRESS,
        safeTxGas: '0',
      })

      const tenderlyPayload = await getSimulationPayload({
        executionOwner: ownerAddress,
        gasLimit: 50_000,
        safe: mockSafeInfo as SafeInfo,
        transactions: mockTx,
      })

      const decodedTxData = safeContractInterface.decodeFunctionData('execTransaction', tenderlyPayload.input)

      // Do add preValidatedSignature of connected owner as the tx is only partially signed
      expect(decodedTxData[9]).toContain(getPreValidatedSignature(ownerAddress))
      // Overwrite the threshold with 1
      expect(tenderlyPayload.state_objects).toBeDefined()
      const safeOverwrite = tenderlyPayload.state_objects![mockSafeAddress]
      expect(safeOverwrite?.storage).toBeDefined()
      expect(safeOverwrite.storage![THRESHOLD_STORAGE_POSITION]).toBe(toBeHex('0x1', 32))
      expect(safeOverwrite.storage![NONCE_STORAGE_POSITION]).toBeUndefined()
    })

    it('batched transaction without gas limit', async () => {
      const ownerAddress = zeroPadValue('0x01', 20)

      const mockSafeInfo: Partial<SafeInfo> = {
        threshold: 2,
        nonce: 0,
        chainId: '4',
        address: { value: zeroPadValue('0x0123', 20) },
      }
      const mockTxs: MetaTransactionData[] = [
        {
          data: '0x',
          to: ZERO_ADDRESS,
          value: '0',
          operation: 0,
        },
        {
          data: '0x',
          to: ZERO_ADDRESS,
          value: '0',
          operation: 0,
        },
        {
          data: '0x',
          to: ZERO_ADDRESS,
          value: '0',
          operation: 0,
        },
      ]

      const tenderlyPayload = await getSimulationPayload({
        executionOwner: ownerAddress,
        safe: mockSafeInfo as SafeInfo,
        transactions: mockTxs,
      })

      const decodedTxData = multiSendContractInterface.decodeFunctionData('multiSend', tenderlyPayload.input)

      expect(tenderlyPayload.to).toEqual(mockMultisendAddress)
      expect(tenderlyPayload.gas).toEqual(30_000_000)
      expect(decodedTxData[0]).toBeDefined()

      expect(tenderlyPayload.state_objects).toBeUndefined()
    })
  })
})
