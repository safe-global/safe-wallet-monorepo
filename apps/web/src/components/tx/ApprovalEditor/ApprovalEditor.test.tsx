import { safeSignatureBuilder, safeTxBuilder } from '@/tests/builders/safeTx'
import { act, fireEvent, getAllByTitle, render, waitFor } from '@/tests/test-utils'
import ApprovalEditor from '.'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import * as approvalInfos from '@/components/tx/ApprovalEditor/hooks/useApprovalInfos'
import { createMockSafeTransaction } from '@/tests/transactions'
import { faker } from '@faker-js/faker'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { ERC20__factory, Multi_send__factory } from '@safe-global/utils/types/contracts'
import { getAndValidateSafeSDK } from '@/services/tx/tx-sender/sdk'
import { parseUnits } from 'ethers'
import { checksumAddress } from '@safe-global/utils/utils/addresses'

jest.mock('@/services/tx/tx-sender/sdk', () => ({
  getAndValidateSafeSDK: jest.fn().mockReturnValue({
    createTransaction: jest.fn(),
  }),
}))

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  ...jest.requireActual('@safe-global/safe-gateway-typescript-sdk'),
  getContract: jest.fn(() => undefined),
  __esModule: true,
}))

const ERC20_INTERFACE = ERC20__factory.createInterface()
const MULTISEND_INTERFACE = Multi_send__factory.createInterface()

describe('ApprovalEditor', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('returns null if there is no safe transaction', () => {
    const result = render(<ApprovalEditor safeTransaction={undefined} />)

    expect(result.container).toBeEmptyDOMElement()
  })

  it('returns null if there are no approvals', () => {
    const mockSafeTx = createMockSafeTransaction({
      to: faker.finance.ethereumAddress(),
      data: '0x',
      operation: OperationType.DelegateCall,
    })
    const result = render(<ApprovalEditor safeTransaction={mockSafeTx} />)

    expect(result.container).toBeEmptyDOMElement()
  })

  it('renders an error', async () => {
    jest
      .spyOn(approvalInfos, 'useApprovalInfos')
      .mockReturnValue([undefined, new Error('Error parsing approvals'), false])
    const mockSafeTx = createMockSafeTransaction({
      to: faker.finance.ethereumAddress(),
      data: '0x',
      operation: OperationType.DelegateCall,
    })

    const result = render(<ApprovalEditor safeTransaction={mockSafeTx} />)

    expect(result.getByText('Error while decoding approval transactions.')).toBeInTheDocument()
  })

  it('renders a loading skeleton', async () => {
    jest.spyOn(approvalInfos, 'useApprovalInfos').mockReturnValue([undefined, undefined, true])
    const mockSafeTx = createMockSafeTransaction({ to: '0x1', data: '0x', operation: OperationType.DelegateCall })

    const result = render(<ApprovalEditor safeTransaction={mockSafeTx} />)

    expect(result.getByTestId('approval-editor-loading')).toBeInTheDocument()
  })

  it('renders a read-only view if the transaction contains signatures', async () => {
    const tokenAddress = faker.finance.ethereumAddress()
    const spenderAddress = faker.finance.ethereumAddress()
    const mockApprovalInfo = {
      tokenInfo: { symbol: 'TST', decimals: 18, address: tokenAddress, type: TokenType.ERC20 },
      tokenAddress,
      spender: spenderAddress,
      amount: '9876456354200000',
      amountFormatted: '987645635420.0',
      method: 'approve',
      transactionIndex: 0,
    } as const
    jest.spyOn(approvalInfos, 'useApprovalInfos').mockReturnValue([[mockApprovalInfo], undefined, false])
    const mockSafeTx = safeTxBuilder()
      .with({
        signatures: new Map().set(faker.finance.ethereumAddress(), safeSignatureBuilder().build()),
      })
      .build()

    const result = render(<ApprovalEditor safeTransaction={mockSafeTx} />)

    const amountInput = result.container.querySelector('input[name="approvals.0"]') as HTMLInputElement

    expect(amountInput).not.toBeInTheDocument()
    expect(result.getByText('TST', { exact: false }))
    expect(result.getByText('987,645,635,420', { exact: false }))
    expect(result.getByText(spenderAddress))
  })

  it('renders a form if there are no signatures', async () => {
    const tokenAddress = faker.finance.ethereumAddress()
    const spenderAddress = faker.finance.ethereumAddress()
    const mockApprovalInfo = {
      tokenInfo: { symbol: 'TST', decimals: 18, address: tokenAddress, type: TokenType.ERC20 },
      tokenAddress,
      spender: spenderAddress,
      amount: '9876456354200000',
      amountFormatted: '987645635420.0',
      method: 'approve',
      transactionIndex: 0,
    } as const
    jest.spyOn(approvalInfos, 'useApprovalInfos').mockReturnValue([[mockApprovalInfo], undefined, false])
    const mockSafeTx = createMockSafeTransaction({
      to: tokenAddress,
      data: '0x',
      operation: OperationType.DelegateCall,
    })

    const result = render(<ApprovalEditor safeTransaction={mockSafeTx} />)

    const amountInput1 = result.container.querySelector('input[name="approvals.0"]') as HTMLInputElement

    expect(amountInput1).toBeInTheDocument

    expect(amountInput1).toHaveValue('987645635420.0')
    expect(result.getByText('TST', { exact: false }))
    expect(result.getByText(spenderAddress))
  })

  it('should modify approvals on save', async () => {
    const tokenAddress = checksumAddress(faker.finance.ethereumAddress())
    const multiSendAddress = checksumAddress(faker.finance.ethereumAddress())
    const spenderAddress = checksumAddress(faker.finance.ethereumAddress())

    const mockSafeTx = createMockSafeTransaction({
      to: multiSendAddress,
      data: MULTISEND_INTERFACE.encodeFunctionData('multiSend', [
        encodeMultiSendData([
          {
            to: tokenAddress,
            data: ERC20_INTERFACE.encodeFunctionData('approve', [spenderAddress, '420000000000000000000']),
            value: '0',
            operation: OperationType.Call,
          },
          {
            to: tokenAddress,
            data: ERC20_INTERFACE.encodeFunctionData('transfer', [spenderAddress, '25']),
            value: '0',
            operation: OperationType.Call,
          },
          {
            to: tokenAddress,
            data: ERC20_INTERFACE.encodeFunctionData('increaseAllowance', [spenderAddress, '690000000000']),
            value: '0',
            operation: OperationType.Call,
          },
        ]),
      ]),
      operation: OperationType.DelegateCall,
    })

    const mockBalances = {
      fiatTotal: '0',
      items: [
        {
          balance: '10',
          tokenInfo: {
            address: tokenAddress,
            decimals: 18,
            logoUri: 'someurl',
            name: 'Test token',
            symbol: 'TST',
            type: TokenType.ERC20,
          },
          fiatBalance: '10',
          fiatConversion: '1',
        },
      ],
    }

    const result = render(<ApprovalEditor safeTransaction={mockSafeTx} />, {
      initialReduxState: {
        balances: {
          data: mockBalances,
          loading: false,
        },
      },
    })

    await waitFor(() => {
      const amountInput1 = result.container.querySelector('input[name="approvals.0"]') as HTMLInputElement
      const amountInput2 = result.container.querySelector('input[name="approvals.1"]') as HTMLInputElement
      expect(amountInput1).toBeInTheDocument()
      expect(amountInput2).toBeInTheDocument()
    })

    // One edit button for each approval
    const editButtons = getAllByTitle(result.container, 'Edit')
    expect(editButtons).toHaveLength(2)

    // Edit and Save first value
    act(() => {
      fireEvent.click(editButtons[0])
      const amountInput1 = result.container.querySelector('input[name="approvals.0"]') as HTMLInputElement
      fireEvent.change(amountInput1!, { target: { value: '100' } })
    })

    let saveButton = result.getByTitle('Save')
    await waitFor(() => {
      expect(saveButton).toBeEnabled()
    })

    act(() => {
      fireEvent.click(saveButton)
    })
    const mockSafe = getAndValidateSafeSDK()
    expect(mockSafe.createTransaction).toHaveBeenCalledWith({
      onlyCalls: true,
      transactions: [
        {
          to: tokenAddress,
          data: ERC20_INTERFACE.encodeFunctionData('approve', [spenderAddress, parseUnits('100', 18)]),
          value: '0',
        },
        {
          to: tokenAddress,
          data: ERC20_INTERFACE.encodeFunctionData('transfer', [spenderAddress, '25']),
          value: '0',
          operation: OperationType.Call,
        },
        {
          to: tokenAddress,
          data: ERC20_INTERFACE.encodeFunctionData('increaseAllowance', [spenderAddress, '690000000000']),
          value: '0',
        },
      ],
    })
  })

  it('should modify increaseAllowance on save', async () => {
    const tokenAddress = checksumAddress(faker.finance.ethereumAddress())
    const multiSendAddress = checksumAddress(faker.finance.ethereumAddress())
    const spenderAddress = checksumAddress(faker.finance.ethereumAddress())

    const mockSafeTx = createMockSafeTransaction({
      to: multiSendAddress,
      data: MULTISEND_INTERFACE.encodeFunctionData('multiSend', [
        encodeMultiSendData([
          {
            to: tokenAddress,
            data: ERC20_INTERFACE.encodeFunctionData('approve', [spenderAddress, '420000000000000000000']),
            value: '0',
            operation: OperationType.Call,
          },
          {
            to: tokenAddress,
            data: ERC20_INTERFACE.encodeFunctionData('transfer', [spenderAddress, '25']),
            value: '0',
            operation: OperationType.Call,
          },
          {
            to: tokenAddress,
            data: ERC20_INTERFACE.encodeFunctionData('increaseAllowance', [spenderAddress, '690000000000']),
            value: '0',
            operation: OperationType.Call,
          },
        ]),
      ]),
      operation: OperationType.DelegateCall,
    })

    const mockBalances = {
      fiatTotal: '0',
      items: [
        {
          balance: '10',
          tokenInfo: {
            address: tokenAddress,
            decimals: 18,
            logoUri: 'someurl',
            name: 'Test token',
            symbol: 'TST',
            type: TokenType.ERC20,
          },
          fiatBalance: '10',
          fiatConversion: '1',
        },
      ],
    }

    const result = render(<ApprovalEditor safeTransaction={mockSafeTx} />, {
      initialReduxState: {
        balances: {
          data: mockBalances,
          loading: false,
        },
      },
    })

    await waitFor(() => {
      const amountInput1 = result.container.querySelector('input[name="approvals.0"]') as HTMLInputElement
      const amountInput2 = result.container.querySelector('input[name="approvals.1"]') as HTMLInputElement
      expect(amountInput1).toBeInTheDocument()
      expect(amountInput2).toBeInTheDocument()
    })

    // One edit button for each approval
    const editButtons = getAllByTitle(result.container, 'Edit')
    expect(editButtons).toHaveLength(2)

    // Edit and Save second value
    act(() => {
      fireEvent.click(editButtons[1])
      const amountInput2 = result.container.querySelector('input[name="approvals.1"]') as HTMLInputElement
      fireEvent.change(amountInput2!, { target: { value: '300' } })
    })

    let saveButton = result.getByTitle('Save')
    await waitFor(() => {
      expect(saveButton).toBeEnabled()
    })

    act(() => {
      fireEvent.click(saveButton)
    })
    const mockSafe = getAndValidateSafeSDK()
    expect(mockSafe.createTransaction).toHaveBeenCalledWith({
      onlyCalls: true,
      transactions: [
        {
          to: tokenAddress,
          data: ERC20_INTERFACE.encodeFunctionData('approve', [spenderAddress, '420000000000000000000']),
          value: '0',
        },
        {
          to: tokenAddress,
          data: ERC20_INTERFACE.encodeFunctionData('transfer', [spenderAddress, '25']),
          value: '0',
          operation: OperationType.Call,
        },
        {
          to: tokenAddress,
          data: ERC20_INTERFACE.encodeFunctionData('increaseAllowance', [spenderAddress, parseUnits('300', 18)]),
          value: '0',
        },
      ],
    })
  })
})
