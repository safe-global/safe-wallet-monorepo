import {
  isAddOwnerWithThresholdCalldata,
  isRemoveOwnerCalldata,
  isSwapOwnerCalldata,
  isChangeThresholdCalldata,
  isMultiSendCalldata,
  getTransactionRecipients,
} from '../transaction-calldata'
import { Safe__factory, ERC20__factory, ERC721__factory } from '@safe-global/utils/types/contracts'
import { Multi_send__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.3.0'
import { encodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils'
import { OperationType } from '@safe-global/types-kit'

describe('transaction-calldata utils', () => {
  const safeInterface = Safe__factory.createInterface()
  const erc20Interface = ERC20__factory.createInterface()
  const erc721Interface = ERC721__factory.createInterface()
  const multiSendInterface = Multi_send__factory.createInterface()

  const TEST_ADDRESS_1 = '0x1111111111111111111111111111111111111111'
  const TEST_ADDRESS_2 = '0x2222222222222222222222222222222222222222'
  const TEST_ADDRESS_3 = '0x3333333333333333333333333333333333333333'

  describe('isAddOwnerWithThresholdCalldata', () => {
    it('should return true for addOwnerWithThreshold calldata', () => {
      const data = safeInterface.encodeFunctionData('addOwnerWithThreshold', [TEST_ADDRESS_1, 2])

      expect(isAddOwnerWithThresholdCalldata(data)).toBe(true)
    })

    it('should return false for removeOwner calldata', () => {
      const data = safeInterface.encodeFunctionData('removeOwner', [TEST_ADDRESS_1, TEST_ADDRESS_2, 1])

      expect(isAddOwnerWithThresholdCalldata(data)).toBe(false)
    })

    it('should return false for non-Safe calldata', () => {
      const data = erc20Interface.encodeFunctionData('transfer', [TEST_ADDRESS_1, 1000])

      expect(isAddOwnerWithThresholdCalldata(data)).toBe(false)
    })

    it('should return false for empty data', () => {
      expect(isAddOwnerWithThresholdCalldata('0x')).toBe(false)
    })
  })

  describe('isRemoveOwnerCalldata', () => {
    it('should return true for removeOwner calldata', () => {
      const data = safeInterface.encodeFunctionData('removeOwner', [TEST_ADDRESS_1, TEST_ADDRESS_2, 1])

      expect(isRemoveOwnerCalldata(data)).toBe(true)
    })

    it('should return false for addOwnerWithThreshold calldata', () => {
      const data = safeInterface.encodeFunctionData('addOwnerWithThreshold', [TEST_ADDRESS_1, 2])

      expect(isRemoveOwnerCalldata(data)).toBe(false)
    })

    it('should return false for swapOwner calldata', () => {
      const data = safeInterface.encodeFunctionData('swapOwner', [TEST_ADDRESS_1, TEST_ADDRESS_2, TEST_ADDRESS_3])

      expect(isRemoveOwnerCalldata(data)).toBe(false)
    })

    it('should return false for empty data', () => {
      expect(isRemoveOwnerCalldata('0x')).toBe(false)
    })
  })

  describe('isSwapOwnerCalldata', () => {
    it('should return true for swapOwner calldata', () => {
      const data = safeInterface.encodeFunctionData('swapOwner', [TEST_ADDRESS_1, TEST_ADDRESS_2, TEST_ADDRESS_3])

      expect(isSwapOwnerCalldata(data)).toBe(true)
    })

    it('should return false for removeOwner calldata', () => {
      const data = safeInterface.encodeFunctionData('removeOwner', [TEST_ADDRESS_1, TEST_ADDRESS_2, 1])

      expect(isSwapOwnerCalldata(data)).toBe(false)
    })

    it('should return false for changeThreshold calldata', () => {
      const data = safeInterface.encodeFunctionData('changeThreshold', [3])

      expect(isSwapOwnerCalldata(data)).toBe(false)
    })
  })

  describe('isChangeThresholdCalldata', () => {
    it('should return true for changeThreshold calldata', () => {
      const data = safeInterface.encodeFunctionData('changeThreshold', [2])

      expect(isChangeThresholdCalldata(data)).toBe(true)
    })

    it('should return true for different threshold values', () => {
      expect(isChangeThresholdCalldata(safeInterface.encodeFunctionData('changeThreshold', [1]))).toBe(true)
      expect(isChangeThresholdCalldata(safeInterface.encodeFunctionData('changeThreshold', [5]))).toBe(true)
      expect(isChangeThresholdCalldata(safeInterface.encodeFunctionData('changeThreshold', [10]))).toBe(true)
    })

    it('should return false for addOwnerWithThreshold calldata', () => {
      const data = safeInterface.encodeFunctionData('addOwnerWithThreshold', [TEST_ADDRESS_1, 2])

      expect(isChangeThresholdCalldata(data)).toBe(false)
    })
  })

  describe('isMultiSendCalldata', () => {
    it('should return true for multiSend calldata', () => {
      const transactions = [
        {
          operation: OperationType.Call,
          to: TEST_ADDRESS_1,
          value: '0',
          data: '0x',
        },
      ]
      const encodedData = encodeMultiSendData(transactions)
      const data = multiSendInterface.encodeFunctionData('multiSend', [encodedData])

      expect(isMultiSendCalldata(data)).toBe(true)
    })

    it('should return false for ERC20 transfer calldata', () => {
      const data = erc20Interface.encodeFunctionData('transfer', [TEST_ADDRESS_1, 1000])

      expect(isMultiSendCalldata(data)).toBe(false)
    })

    it('should return false for Safe function calldata', () => {
      const data = safeInterface.encodeFunctionData('addOwnerWithThreshold', [TEST_ADDRESS_1, 2])

      expect(isMultiSendCalldata(data)).toBe(false)
    })
  })

  describe('getTransactionRecipients', () => {
    describe('ERC20 transfers', () => {
      it('should extract recipient from ERC20 transfer', () => {
        const data = erc20Interface.encodeFunctionData('transfer', [TEST_ADDRESS_1, 1000])

        const recipients = getTransactionRecipients({
          to: '0xTokenAddress',
          value: '0',
          data,
        })

        expect(recipients).toEqual([TEST_ADDRESS_1])
      })

      it('should extract recipient from ERC20 transfer with large amount', () => {
        const largeAmount = BigInt('1000000000000000000000') // 1000 tokens with 18 decimals
        const data = erc20Interface.encodeFunctionData('transfer', [TEST_ADDRESS_2, largeAmount])

        const recipients = getTransactionRecipients({
          to: '0xTokenAddress',
          value: '0',
          data,
        })

        expect(recipients).toEqual([TEST_ADDRESS_2])
      })
    })

    describe('ERC721 transfers', () => {
      it('should extract recipient from ERC721 transferFrom', () => {
        const tokenId = 123
        const data = erc721Interface.encodeFunctionData('transferFrom', [TEST_ADDRESS_1, TEST_ADDRESS_2, tokenId])

        const recipients = getTransactionRecipients({
          to: '0xNFTAddress',
          value: '0',
          data,
        })

        expect(recipients).toEqual([TEST_ADDRESS_2])
      })

      it('should extract recipient from ERC721 safeTransferFrom', () => {
        const tokenId = 456
        const data = erc721Interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [
          TEST_ADDRESS_1,
          TEST_ADDRESS_3,
          tokenId,
        ])

        const recipients = getTransactionRecipients({
          to: '0xNFTAddress',
          value: '0',
          data,
        })

        expect(recipients).toEqual([TEST_ADDRESS_3])
      })

      it('should extract recipient from ERC721 safeTransferFrom with bytes', () => {
        const tokenId = 789
        const extraData = '0x1234'
        const data = erc721Interface.encodeFunctionData('safeTransferFrom(address,address,uint256,bytes)', [
          TEST_ADDRESS_2,
          TEST_ADDRESS_1,
          tokenId,
          extraData,
        ])

        const recipients = getTransactionRecipients({
          to: '0xNFTAddress',
          value: '0',
          data,
        })

        expect(recipients).toEqual([TEST_ADDRESS_1])
      })
    })

    describe('MultiSend transactions', () => {
      it('should extract recipients from multiSend with multiple transfers', () => {
        const TOKEN_ADDRESS_1 = '0x4444444444444444444444444444444444444444'
        const TOKEN_ADDRESS_2 = '0x5555555555555555555555555555555555555555'
        const MULTISEND_ADDRESS = '0x6666666666666666666666666666666666666666'

        const tx1Data = erc20Interface.encodeFunctionData('transfer', [TEST_ADDRESS_1, 1000])
        const tx2Data = erc20Interface.encodeFunctionData('transfer', [TEST_ADDRESS_2, 2000])

        const transactions = [
          {
            operation: OperationType.Call,
            to: TOKEN_ADDRESS_1,
            value: '0',
            data: tx1Data,
          },
          {
            operation: OperationType.Call,
            to: TOKEN_ADDRESS_2,
            value: '0',
            data: tx2Data,
          },
        ]

        const encodedData = encodeMultiSendData(transactions)
        const data = multiSendInterface.encodeFunctionData('multiSend', [encodedData])

        const recipients = getTransactionRecipients({
          to: MULTISEND_ADDRESS,
          value: '0',
          data,
        })

        expect(recipients).toEqual([TEST_ADDRESS_1, TEST_ADDRESS_2])
      })

      it('should extract recipients from multiSend with mixed transaction types', () => {
        const TOKEN_ADDRESS = '0x7777777777777777777777777777777777777777'
        const NFT_ADDRESS = '0x8888888888888888888888888888888888888888'
        const MULTISEND_ADDRESS = '0x9999999999999999999999999999999999999999'

        const erc20Data = erc20Interface.encodeFunctionData('transfer', [TEST_ADDRESS_1, 1000])
        const erc721Data = erc721Interface.encodeFunctionData('transferFrom', [TEST_ADDRESS_1, TEST_ADDRESS_2, 123])

        const transactions = [
          {
            operation: OperationType.Call,
            to: TOKEN_ADDRESS,
            value: '0',
            data: erc20Data,
          },
          {
            operation: OperationType.Call,
            to: NFT_ADDRESS,
            value: '0',
            data: erc721Data,
          },
          {
            operation: OperationType.Call,
            to: TEST_ADDRESS_3,
            value: '1000000000000000000', // 1 ETH
            data: '0x',
          },
        ]

        const encodedData = encodeMultiSendData(transactions)
        const data = multiSendInterface.encodeFunctionData('multiSend', [encodedData])

        const recipients = getTransactionRecipients({
          to: MULTISEND_ADDRESS,
          value: '0',
          data,
        })

        expect(recipients).toEqual([TEST_ADDRESS_1, TEST_ADDRESS_2, TEST_ADDRESS_3])
      })

      it('should handle empty multiSend', () => {
        const transactions: any[] = []
        const encodedData = encodeMultiSendData(transactions)
        const data = multiSendInterface.encodeFunctionData('multiSend', [encodedData])

        const recipients = getTransactionRecipients({
          to: '0xMultiSendAddress',
          value: '0',
          data,
        })

        expect(recipients).toEqual([])
      })
    })

    describe('Native transfers and other transactions', () => {
      it('should return transaction "to" address for native transfer', () => {
        const recipients = getTransactionRecipients({
          to: TEST_ADDRESS_1,
          value: '1000000000000000000', // 1 ETH
          data: '0x',
        })

        expect(recipients).toEqual([TEST_ADDRESS_1])
      })

      it('should return transaction "to" address for unknown calldata', () => {
        const recipients = getTransactionRecipients({
          to: TEST_ADDRESS_2,
          value: '0',
          data: '0x12345678', // Unknown function signature
        })

        expect(recipients).toEqual([TEST_ADDRESS_2])
      })

      it('should return transaction "to" address for Safe ownership change', () => {
        const data = safeInterface.encodeFunctionData('addOwnerWithThreshold', [TEST_ADDRESS_1, 2])

        const recipients = getTransactionRecipients({
          to: '0xSafeAddress',
          value: '0',
          data,
        })

        expect(recipients).toEqual(['0xSafeAddress'])
      })
    })

    describe('edge cases', () => {
      it('should handle transaction with empty data', () => {
        const recipients = getTransactionRecipients({
          to: TEST_ADDRESS_1,
          value: '0',
          data: '0x',
        })

        expect(recipients).toEqual([TEST_ADDRESS_1])
      })

      it('should handle ERC20 transfer with zero amount', () => {
        const data = erc20Interface.encodeFunctionData('transfer', [TEST_ADDRESS_1, 0])

        const recipients = getTransactionRecipients({
          to: '0xTokenAddress',
          value: '0',
          data,
        })

        expect(recipients).toEqual([TEST_ADDRESS_1])
      })
    })
  })
})
