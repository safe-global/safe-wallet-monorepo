import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { renderHook } from '@/tests/test-utils'
import { Interface, zeroPadValue } from 'ethers'
import { type ApprovalInfo, useApprovalInfos } from '@/components/tx/ApprovalEditor/hooks/useApprovalInfos'
import { waitFor } from '@testing-library/react'
import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import { ERC20__factory, Multi_send__factory } from '@safe-global/utils/types/contracts'
import * as balances from '@/hooks/useBalances'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import * as getTokenInfo from '@/utils/tokens'
import { faker } from '@faker-js/faker'
import { PSEUDO_APPROVAL_VALUES } from '../utils/approvals'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { UNLIMITED_PERMIT2_AMOUNT } from '@safe-global/utils/utils/tokens'

const ERC20_INTERFACE = ERC20__factory.createInterface()

const MULTISEND_INTERFACE = Multi_send__factory.createInterface()

const UNLIMITED_APPROVAL = 115792089237316195423570985008687907853269984665640564039457584007913129639935n

const createNonApproveCallData = (to: string, value: string) => {
  return ERC20_INTERFACE.encodeFunctionData('transfer', [to, value])
}

describe('useApprovalInfos', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('returns an empty array if no Safe Transaction exists', async () => {
    const { result } = renderHook(() => useApprovalInfos({}))

    expect(result.current).toStrictEqual([[], undefined, true])

    await waitFor(() => {
      expect(result.current).toStrictEqual([[], undefined, false])
    })
  })

  it('returns an empty array if the transaction does not contain any approvals', async () => {
    const mockSafeTx = createMockSafeTransaction({
      to: zeroPadValue('0x0123', 20),
      data: createNonApproveCallData(zeroPadValue('0x02', 20), '20'),
      operation: OperationType.DelegateCall,
    })

    const { result } = renderHook(() => useApprovalInfos({ safeTransaction: mockSafeTx }))

    await waitFor(() => {
      expect(result.current).toStrictEqual([[], undefined, false])
    })
  })

  it('returns an ApprovalInfo if the transaction contains an approval', async () => {
    const mockSafeTx = createMockSafeTransaction({
      to: zeroPadValue('0x0123', 20),
      data: ERC20_INTERFACE.encodeFunctionData('approve', [zeroPadValue('0x02', 20), '123']),
      operation: OperationType.Call,
    })

    const { result } = renderHook(() => useApprovalInfos({ safeTransaction: mockSafeTx }))

    const mockApproval: ApprovalInfo = {
      amount: BigInt('123'),
      amountFormatted: '0.000000000000000123',
      spender: '0x0000000000000000000000000000000000000002',
      tokenAddress: '0x0000000000000000000000000000000000000123',
      tokenInfo: undefined,
      method: 'approve',
      transactionIndex: 0,
    }

    await waitFor(() => {
      expect(result.current).toEqual([[mockApproval], undefined, false])
    })
  })

  it('returns an ApprovalInfo if the transaction contains an increaseAllowance call', async () => {
    const testInterface = new Interface(['function increaseAllowance(address, uint256)'])

    const mockSafeTx = createMockSafeTransaction({
      to: zeroPadValue('0x0123', 20),
      data: testInterface.encodeFunctionData('increaseAllowance', [zeroPadValue('0x02', 20), '123']),
      operation: OperationType.Call,
    })

    const { result } = renderHook(() => useApprovalInfos({ safeTransaction: mockSafeTx }))

    const mockApproval: ApprovalInfo = {
      amount: BigInt('123'),
      amountFormatted: '0.000000000000000123',
      spender: '0x0000000000000000000000000000000000000002',
      tokenAddress: '0x0000000000000000000000000000000000000123',
      tokenInfo: undefined,
      method: 'increaseAllowance',
      transactionIndex: 0,
    }

    await waitFor(() => {
      expect(result.current).toEqual([[mockApproval], undefined, false])
    })
  })

  it('returns multiple ApprovalInfos if the transaction is a multiSend containing an approve and increaseAllowance call', async () => {
    const testInterface = new Interface(['function increaseAllowance(address, uint256)'])

    const mockMultiSendAddress = checksumAddress(faker.finance.ethereumAddress())
    const mockTokenAddress1 = checksumAddress(faker.finance.ethereumAddress())
    const mockTokenAddress2 = checksumAddress(faker.finance.ethereumAddress())
    const mockSpender = checksumAddress(faker.finance.ethereumAddress())

    const multiSendData = encodeMultiSendData([
      {
        to: mockTokenAddress1,
        data: testInterface.encodeFunctionData('increaseAllowance', [mockSpender, '123']),
        value: '0',
        operation: OperationType.Call,
      },
      {
        to: mockTokenAddress2,
        data: ERC20_INTERFACE.encodeFunctionData('approve', [mockSpender, '456']),
        value: '0',
        operation: OperationType.Call,
      },
    ])

    const mockSafeTx = createMockSafeTransaction({
      to: mockMultiSendAddress,
      data: MULTISEND_INTERFACE.encodeFunctionData('multiSend', [multiSendData]),
      operation: OperationType.DelegateCall,
    })

    const { result } = renderHook(() => useApprovalInfos({ safeTransaction: mockSafeTx }))

    const expectedApprovals: ApprovalInfo[] = [
      {
        amount: BigInt('123'),
        amountFormatted: '0.000000000000000123',
        spender: mockSpender,
        tokenAddress: mockTokenAddress1,
        tokenInfo: undefined,
        method: 'increaseAllowance',
        transactionIndex: 0,
      },
      {
        amount: BigInt('456'),
        amountFormatted: '0.000000000000000456',
        spender: mockSpender,
        tokenAddress: mockTokenAddress2,
        tokenInfo: undefined,
        method: 'approve',
        transactionIndex: 1,
      },
    ]

    await waitFor(() => {
      expect(result.current).toEqual([expectedApprovals, undefined, false])
    })
  })

  it('returns multiple ApprovalInfos if the transaction is a multiSend containing 2 approvals and other transaction inbetween', async () => {
    const testInterface = new Interface(['function increaseAllowance(address, uint256)'])

    const mockMultiSendAddress = checksumAddress(faker.finance.ethereumAddress())
    const mockTokenAddress1 = checksumAddress(faker.finance.ethereumAddress())
    const mockTokenAddress2 = checksumAddress(faker.finance.ethereumAddress())
    const mockSpender = checksumAddress(faker.finance.ethereumAddress())

    const multiSendData = encodeMultiSendData([
      {
        to: mockTokenAddress1,
        data: ERC20_INTERFACE.encodeFunctionData('transfer', [mockSpender, '1']),
        value: '0',
        operation: OperationType.Call,
      },
      {
        to: mockTokenAddress1,
        data: testInterface.encodeFunctionData('increaseAllowance', [mockSpender, '123']),
        value: '0',
        operation: OperationType.Call,
      },
      {
        to: mockTokenAddress1,
        data: ERC20_INTERFACE.encodeFunctionData('transferFrom', [faker.finance.ethereumAddress(), mockSpender, '1']),
        value: '0',
        operation: OperationType.Call,
      },
      {
        to: mockTokenAddress2,
        data: ERC20_INTERFACE.encodeFunctionData('approve', [mockSpender, '456']),
        value: '0',
        operation: OperationType.Call,
      },
      {
        to: mockTokenAddress2,
        data: ERC20_INTERFACE.encodeFunctionData('transfer', [mockSpender, '5']),
        value: '0',
        operation: OperationType.Call,
      },
    ])

    const mockSafeTx = createMockSafeTransaction({
      to: mockMultiSendAddress,
      data: MULTISEND_INTERFACE.encodeFunctionData('multiSend', [multiSendData]),
      operation: OperationType.DelegateCall,
    })

    const { result } = renderHook(() => useApprovalInfos({ safeTransaction: mockSafeTx }))

    const expectedApprovals: ApprovalInfo[] = [
      {
        amount: BigInt('123'),
        amountFormatted: '0.000000000000000123',
        spender: mockSpender,
        tokenAddress: mockTokenAddress1,
        tokenInfo: undefined,
        method: 'increaseAllowance',
        transactionIndex: 1,
      },
      {
        amount: BigInt('456'),
        amountFormatted: '0.000000000000000456',
        spender: mockSpender,
        tokenAddress: mockTokenAddress2,
        tokenInfo: undefined,
        method: 'approve',
        transactionIndex: 3,
      },
    ]

    await waitFor(() => {
      expect(result.current).toEqual([expectedApprovals, undefined, false])
    })
  })

  it('returns an ApprovalInfo for Permit2 PermitSingle message', async () => {
    const spenderAddress = faker.finance.ethereumAddress()
    const mockMessage: TypedData = {
      primaryType: 'PermitSingle',
      types: {
        EIP712Domain: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'chainId',
            type: 'uint256',
          },
          {
            name: 'verifyingContract',
            type: 'address',
          },
        ],
        PermitSingle: [
          {
            name: 'details',
            type: 'PermitDetails',
          },
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'sigDeadline',
            type: 'uint256',
          },
        ],
        PermitDetails: [
          {
            name: 'token',
            type: 'address',
          },
          {
            name: 'amount',
            type: 'uint160',
          },
          {
            name: 'expiration',
            type: 'uint48',
          },
          {
            name: 'nonce',
            type: 'uint48',
          },
        ],
      },
      domain: {
        name: 'Permit2',
        chainId: 137,
        verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
      },
      message: {
        spender: spenderAddress,
        sigDeadline: BigInt('0xffffffffffff'),
        details: {
          token: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          amount: BigInt('0xffffffffffffffffffffffffffffffffffffffff'),
          expiration: BigInt('0xffffffffffff'),
          nonce: 0,
        },
      },
    }

    const { result } = renderHook(() => useApprovalInfos({ safeMessage: mockMessage }))

    const mockApproval: ApprovalInfo = {
      amount: BigInt(UNLIMITED_PERMIT2_AMOUNT),
      amountFormatted: PSEUDO_APPROVAL_VALUES.UNLIMITED,
      spender: spenderAddress,
      tokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'.toLowerCase(),
      tokenInfo: undefined,
      method: 'Permit2',
      transactionIndex: 0,
    }

    await waitFor(() => {
      expect(result.current).toEqual([[mockApproval], undefined, false])
    })
  })

  it('returns multiple ApprovalInfos for Permit2 PermitBatch message', async () => {
    const spenderAddress = faker.finance.ethereumAddress()
    const token1 = faker.finance.ethereumAddress()
    const token2 = faker.finance.ethereumAddress()

    const mockMessage: TypedData = {
      primaryType: 'PermitBatch',
      types: {
        EIP712Domain: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'chainId',
            type: 'uint256',
          },
          {
            name: 'verifyingContract',
            type: 'address',
          },
        ],
        PermitBatch: [
          {
            name: 'details',
            type: 'PermitDetails[]',
          },
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'sigDeadline',
            type: 'uint256',
          },
        ],
        PermitDetails: [
          {
            name: 'token',
            type: 'address',
          },
          {
            name: 'amount',
            type: 'uint160',
          },
          {
            name: 'expiration',
            type: 'uint48',
          },
          {
            name: 'nonce',
            type: 'uint48',
          },
        ],
      },
      domain: {
        name: 'Permit2',
        chainId: 137,
        verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
      },
      message: {
        spender: spenderAddress,
        sigDeadline: BigInt('0xffffffffffff'),
        details: [
          {
            token: token1,
            amount: BigInt('0xffffffffffffffffffffffffffffffffffffffff'),
            expiration: BigInt('0xffffffffffff'),
            nonce: 0,
          },
          {
            token: token2,
            amount: BigInt('0xffffffffffffffffffffffffffffffffffffffff'),
            expiration: BigInt('0xffffffffffff'),
            nonce: 0,
          },
        ],
      },
    }

    const { result } = renderHook(() => useApprovalInfos({ safeMessage: mockMessage }))

    const expectedApprovals: ApprovalInfo[] = [
      {
        amount: BigInt(UNLIMITED_PERMIT2_AMOUNT),
        amountFormatted: PSEUDO_APPROVAL_VALUES.UNLIMITED,
        spender: spenderAddress,
        tokenAddress: token1.toLowerCase(),
        tokenInfo: undefined,
        method: 'Permit2',
        transactionIndex: 0,
      },
      {
        amount: BigInt(UNLIMITED_PERMIT2_AMOUNT),
        amountFormatted: PSEUDO_APPROVAL_VALUES.UNLIMITED,
        spender: spenderAddress,
        tokenAddress: token2.toLowerCase(),
        tokenInfo: undefined,
        method: 'Permit2',
        transactionIndex: 1,
      },
    ]

    await waitFor(() => {
      expect(result.current).toEqual([expectedApprovals, undefined, false])
    })
  })

  it('returns an ApprovalInfo with token infos if the token exists in balances', async () => {
    const mockBalanceItem = {
      balance: '40',
      fiatBalance: '40',
      fiatConversion: '1',
      tokenInfo: {
        address: zeroPadValue('0x0123', 20),
        decimals: 18,
        logoUri: '',
        name: 'Hidden Token',
        symbol: 'HT',
        type: TokenType.ERC20,
      },
    }

    jest
      .spyOn(balances, 'default')
      .mockReturnValue({ balances: { fiatTotal: '0', items: [mockBalanceItem] }, error: undefined, loading: false })
    const testInterface = new Interface(['function approve(address, uint256)'])

    const mockSafeTx = createMockSafeTransaction({
      to: zeroPadValue('0x0123', 20),
      data: testInterface.encodeFunctionData('approve', [zeroPadValue('0x02', 20), '123']),
      operation: OperationType.DelegateCall,
    })

    const { result } = renderHook(() => useApprovalInfos({ safeTransaction: mockSafeTx }))

    const mockApproval: ApprovalInfo = {
      amount: BigInt('123'),
      amountFormatted: '0.000000000000000123',
      spender: '0x0000000000000000000000000000000000000002',
      tokenAddress: '0x0000000000000000000000000000000000000123',
      tokenInfo: mockBalanceItem.tokenInfo,
      method: 'approve',
      transactionIndex: 0,
    }

    await waitFor(() => {
      expect(result.current).toEqual([[mockApproval], undefined, false])
    })
  })

  it('fetches token info for an approval if its missing', async () => {
    const mockTokenInfo = {
      address: '0x0000000000000000000000000000000000000123',
      symbol: 'HT',
      decimals: 18,
      type: TokenType.ERC20,
    }
    const fetchMock = jest
      .spyOn(getTokenInfo, 'getERC20TokenInfoOnChain')
      .mockReturnValue(Promise.resolve(mockTokenInfo))
    const testInterface = new Interface(['function approve(address, uint256)'])

    const mockSafeTx = createMockSafeTransaction({
      to: zeroPadValue('0x0123', 20),
      data: testInterface.encodeFunctionData('approve', [zeroPadValue('0x02', 20), '123']),
      operation: OperationType.DelegateCall,
    })

    const { result } = renderHook(() => useApprovalInfos({ safeTransaction: mockSafeTx }))

    const mockApproval: ApprovalInfo = {
      amount: BigInt('123'),
      amountFormatted: '0.000000000000000123',
      spender: '0x0000000000000000000000000000000000000002',
      tokenAddress: '0x0000000000000000000000000000000000000123',
      tokenInfo: mockTokenInfo,
      method: 'approve',
      transactionIndex: 0,
    }

    await waitFor(() => {
      expect(result.current).toEqual([[mockApproval], undefined, false])
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  it('detect unlimited approvals and format them as "Unlimited"', async () => {
    const testInterface = new Interface(['function approve(address, uint256)'])

    const mockSafeTx = createMockSafeTransaction({
      to: zeroPadValue('0x0123', 20),
      data: testInterface.encodeFunctionData('approve', [zeroPadValue('0x02', 20), UNLIMITED_APPROVAL]),
      operation: OperationType.Call,
    })

    const { result } = renderHook(() => useApprovalInfos({ safeTransaction: mockSafeTx }))

    const mockApproval: ApprovalInfo = {
      amount: UNLIMITED_APPROVAL,
      amountFormatted: PSEUDO_APPROVAL_VALUES.UNLIMITED,
      spender: '0x0000000000000000000000000000000000000002',
      tokenAddress: '0x0000000000000000000000000000000000000123',
      tokenInfo: undefined,
      method: 'approve',
      transactionIndex: 0,
    }

    await waitFor(() => {
      expect(result.current).toEqual([[mockApproval], undefined, false])
    })
  })
})
