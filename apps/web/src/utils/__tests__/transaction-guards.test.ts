import {
  isExecTxData,
  isExecTxInfo,
  isOnChainConfirmationTxData,
  isOnChainConfirmationTxInfo,
  isSafeUpdateTxData,
} from '../transaction-guards'
import { faker } from '@faker-js/faker'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { TransactionInfoType, TransactionTokenType, TransferDirection } from '@safe-global/safe-gateway-typescript-sdk'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'

describe('transaction-guards', () => {
  describe('isOnChainConfirmationTxData', () => {
    it('should return false for undefined', () => {
      expect(isOnChainConfirmationTxData(undefined)).toBeFalsy()
    })

    it('should return false for arbitrary txData', () => {
      expect(
        isOnChainConfirmationTxData({
          operation: 0,
          to: { value: faker.finance.ethereumAddress() },
          trustedDelegateCallTarget: false,
          addressInfoIndex: undefined,
          dataDecoded: undefined,
          hexData: faker.string.hexadecimal({ length: 64 }),
        }),
      ).toBeFalsy()
    })

    it('should return true for approveHash calls', () => {
      const safeInterface = Safe__factory.createInterface()
      expect(
        isOnChainConfirmationTxData({
          operation: 0,
          to: { value: faker.finance.ethereumAddress() },
          trustedDelegateCallTarget: false,
          addressInfoIndex: undefined,
          dataDecoded: undefined,
          hexData: safeInterface.encodeFunctionData('approveHash', [faker.string.hexadecimal({ length: 64 })]),
        }),
      ).toBeTruthy()
    })
  })

  describe('isOnChainConfirmationTxInfo', () => {
    it('should return false for non-custom tx infos', () => {
      expect(
        isOnChainConfirmationTxInfo({
          type: TransactionInfoType.TRANSFER,
          direction: TransferDirection.INCOMING,
          recipient: { value: faker.finance.ethereumAddress() },
          sender: { value: faker.finance.ethereumAddress() },
          transferInfo: {
            imitation: false,
            tokenAddress: faker.finance.ethereumAddress(),
            type: TransactionTokenType.ERC20,
            trusted: true,
            value: '100',
          },
        }),
      ).toBeFalsy()
    })

    it('should return false for approveHash custom txs with mismatching data', () => {
      expect(
        isOnChainConfirmationTxInfo({
          type: TransactionInfoType.CUSTOM,
          dataSize: '69',
          isCancellation: false,
          to: { value: faker.finance.ethereumAddress() },
          value: '0',
          methodName: 'approveHash',
        }),
      ).toBeFalsy()
    })

    it('should return true for approveHash custom txs', () => {
      expect(
        isOnChainConfirmationTxInfo({
          type: TransactionInfoType.CUSTOM,
          dataSize: '36',
          isCancellation: false,
          to: { value: faker.finance.ethereumAddress() },
          value: '0',
          methodName: 'approveHash',
        }),
      ).toBeTruthy()
    })
  })

  describe('isExecTxData', () => {
    it('should return false for undefined', () => {
      expect(isExecTxData(undefined)).toBeFalsy()
    })

    it('should return false for arbitrary txData', () => {
      expect(
        isExecTxData({
          operation: 0,
          to: { value: faker.finance.ethereumAddress() },
          trustedDelegateCallTarget: false,
          addressInfoIndex: undefined,
          dataDecoded: undefined,
          hexData: faker.string.hexadecimal({ length: 64 }),
        }),
      ).toBeFalsy()
    })
    it('should return true for execTransaction calls', () => {
      const safeInterface = Safe__factory.createInterface()
      expect(
        isExecTxData({
          operation: 0,
          to: { value: faker.finance.ethereumAddress() },
          trustedDelegateCallTarget: false,
          addressInfoIndex: undefined,
          dataDecoded: undefined,
          hexData: safeInterface.encodeFunctionData('execTransaction', [
            faker.finance.ethereumAddress(),
            '0',
            faker.string.hexadecimal({ length: 64 }),
            0,
            0,
            0,
            0,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            faker.string.hexadecimal({ length: 130 }),
          ]),
        }),
      ).toBeTruthy()
    })
  })

  describe('isExecTxInfo', () => {
    it('should return false for non-custom tx infos', () => {
      expect(
        isExecTxInfo({
          type: TransactionInfoType.TRANSFER,
          direction: TransferDirection.INCOMING,
          recipient: { value: faker.finance.ethereumAddress() },
          sender: { value: faker.finance.ethereumAddress() },
          transferInfo: {
            imitation: false,
            tokenAddress: faker.finance.ethereumAddress(),
            type: TransactionTokenType.ERC20,
            trusted: true,
            value: '100',
          },
        }),
      ).toBeFalsy()
    })

    it('should return true for execTransaction custom txs', () => {
      expect(
        isExecTxInfo({
          type: TransactionInfoType.CUSTOM,
          dataSize: '420',
          isCancellation: false,
          to: { value: faker.finance.ethereumAddress() },
          value: '0',
          methodName: 'execTransaction',
        }),
      ).toBeTruthy()
    })
  })

  describe('isSafeUpdateTxData', () => {
    it('should return true for 1.3.0+ migrations', () => {
      const mockTxData = {
        hexData: '0xed007fc6',
        to: {
          value: '0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6',
          name: 'SafeMigration 1.4.1',
          logoUri: '',
        },
        value: '0',
        operation: 1,
        trustedDelegateCallTarget: true,
      }
      expect(isSafeUpdateTxData(mockTxData)).toBeTruthy()
    })

    it('should return false for arbitrary txData', () => {
      expect(
        isSafeUpdateTxData({
          operation: 0,
          to: { value: faker.finance.ethereumAddress() },
          trustedDelegateCallTarget: false,
          addressInfoIndex: undefined,
          dataDecoded: undefined,
          hexData: faker.string.hexadecimal({ length: 64 }),
        }),
      ).toBeFalsy()
    })

    it('should return true for older Safe masterCopyChange calls', () => {
      const mockTxData = {
        hexData:
          '0x8d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000f20085c9f5aa0f82a531087a356a55623cf05e7bb895000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000247de7edef00000000000000000000000041675c099f32341bf84bfc5382af534df5c7461a0085c9f5aa0f82a531087a356a55623cf05e7bb89500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f08a0323000000000000000000000000fd0732dc9e303f09fcef3a7388ad10a83459ec990000000000000000000000000000',
        dataDecoded: {
          method: 'multiSend',
          parameters: [
            {
              name: 'transactions',
              type: 'bytes',
              value:
                '0x0085c9f5aa0f82a531087a356a55623cf05e7bb895000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000247de7edef00000000000000000000000041675c099f32341bf84bfc5382af534df5c7461a0085c9f5aa0f82a531087a356a55623cf05e7bb89500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f08a0323000000000000000000000000fd0732dc9e303f09fcef3a7388ad10a83459ec99',
              valueDecoded: [
                {
                  operation: 0,
                  to: '0x85C9f5aA0F82A531087a356a55623Cf05E7Bb895',
                  value: '0',
                  data: '0x7de7edef00000000000000000000000041675c099f32341bf84bfc5382af534df5c7461a',
                  dataDecoded: {
                    method: 'changeMasterCopy',
                    parameters: [
                      {
                        name: '_masterCopy',
                        type: 'address',
                        value: '0x41675C099F32341bf84BFc5382aF534df5C7461a',
                      },
                    ],
                  },
                },
                {
                  operation: 0,
                  to: '0x85C9f5aA0F82A531087a356a55623Cf05E7Bb895',
                  value: '0',
                  data: '0xf08a0323000000000000000000000000fd0732dc9e303f09fcef3a7388ad10a83459ec99',
                  dataDecoded: {
                    method: 'setFallbackHandler',
                    parameters: [
                      {
                        name: 'handler',
                        type: 'address',
                        value: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        to: {
          value: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
          name: 'Safe: MultiSendCallOnly 1.3.0',
          logoUri: '',
        },
        value: '0',
        operation: 1,
        trustedDelegateCallTarget: true,
      }

      expect(isSafeUpdateTxData(mockTxData)).toBeTruthy()
    })

    it('should return false for arbitrary multisends', () => {
      const mockTxData = {
        hexData:
          '0x8d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000f20085c9f5aa0f82a531087a356a55623cf05e7bb895000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000247de7edef00000000000000000000000041675c099f32341bf84bfc5382af534df5c7461a0085c9f5aa0f82a531087a356a55623cf05e7bb89500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f08a0323000000000000000000000000fd0732dc9e303f09fcef3a7388ad10a83459ec990000000000000000000000000000',
        dataDecoded: {
          method: 'multiSend',
          parameters: [],
        },
        to: {
          value: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
          name: 'Safe: MultiSendCallOnly 1.3.0',
          logoUri: '',
        },
        value: '0',
        operation: 1,
        trustedDelegateCallTarget: true,
      }

      expect(isSafeUpdateTxData(mockTxData)).toBeFalsy()
    })
  })
})
