import { act, fireEvent, render, waitFor } from '@/tests/test-utils'
import { toBeHex } from 'ethers'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { ApprovalEditorForm } from '@/components/tx/ApprovalEditor/ApprovalEditorForm'
import { getAllByTestId, getAllByTitle } from '@testing-library/dom'
import type { ApprovalInfo } from './hooks/useApprovalInfos'
import { faker } from '@faker-js/faker'

describe('ApprovalEditorForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const updateCallback = jest.fn()

  it('should render and edit multiple txs', async () => {
    const tokenAddress1 = toBeHex('0x123', 20)
    const tokenAddress2 = toBeHex('0x234', 20)
    const spenderAddress = faker.finance.ethereumAddress()
    const mockApprovalInfos: ApprovalInfo[] = [
      {
        tokenInfo: { symbol: 'TST', decimals: 18, address: tokenAddress1, type: TokenType.ERC20 },
        tokenAddress: tokenAddress1,
        spender: spenderAddress,
        amount: '4200000',
        amountFormatted: '420.0',
        method: 'approve',
        transactionIndex: 0,
      },
      {
        tokenInfo: { symbol: 'TST', decimals: 18, address: tokenAddress2, type: TokenType.ERC20 },
        tokenAddress: tokenAddress2,
        spender: spenderAddress,
        amount: '6900000',
        amountFormatted: '69.0',
        method: 'increaseAllowance',
        transactionIndex: 1,
      },
    ]

    const result = render(<ApprovalEditorForm approvalInfos={mockApprovalInfos} updateApprovals={updateCallback} />)

    // All approvals are rendered
    const approvalItems = getAllByTestId(result.container, 'approval-item')
    expect(approvalItems).toHaveLength(2)

    // One edit button for each approval
    const editButtons = getAllByTitle(result.container, 'Edit')
    expect(editButtons).toHaveLength(2)

    // First approval value is rendered
    await waitFor(() => {
      const amountInput = result.container.querySelector('input[name="approvals.0"]') as HTMLInputElement
      expect(amountInput).not.toBeNull()
      expect(amountInput).toHaveValue('420.0')
      expect(amountInput).toBeEnabled()
      expect(amountInput).toHaveAttribute('readOnly')
    })

    // Change value of first approval
    act(() => {
      fireEvent.click(editButtons[0])
      const amountInput1 = result.container.querySelector('input[name="approvals.0"]') as HTMLInputElement

      fireEvent.change(amountInput1!, { target: { value: '123' } })
    })
    let saveButton = result.getByTitle('Save')
    await waitFor(() => {
      expect(saveButton).toBeEnabled()
    })
    act(() => {
      fireEvent.click(saveButton)
    })

    expect(updateCallback).toHaveBeenCalledWith(['123', '69.0'])

    // Second approval value is rendered
    await waitFor(() => {
      const amountInput = result.container.querySelector('input[name="approvals.1"]') as HTMLInputElement
      expect(amountInput).not.toBeNull()
      expect(amountInput).toHaveValue('69.0')
      expect(amountInput).toBeEnabled()
    })

    // Change value of second approval
    act(() => {
      fireEvent.click(editButtons[1])
      const amountInput2 = result.container.querySelector('input[name="approvals.1"]') as HTMLInputElement
      fireEvent.change(amountInput2!, { target: { value: '456' } })
    })

    saveButton = result.getByTitle('Save')
    await waitFor(() => {
      expect(saveButton).toBeEnabled()
    })
    act(() => {
      fireEvent.click(saveButton)
    })

    expect(updateCallback).toHaveBeenCalledWith(['123', '456'])
  })

  it('should render and edit single tx', async () => {
    const tokenAddress = toBeHex('0x123', 20)

    const mockApprovalInfo: ApprovalInfo = {
      tokenInfo: { symbol: 'TST', decimals: 18, address: tokenAddress, type: TokenType.ERC20 },
      tokenAddress,
      spender: faker.finance.ethereumAddress(),
      amount: '4200000',
      amountFormatted: '420.0',
      method: 'approve',
      transactionIndex: 0,
    }

    const result = render(<ApprovalEditorForm approvalInfos={[mockApprovalInfo]} updateApprovals={updateCallback} />)

    // Approval item is rendered
    const approvalItem = result.getByTestId('approval-item')
    expect(approvalItem).not.toBeNull()

    // Input with correct value is rendered
    await waitFor(() => {
      const amountInput = result.container.querySelector('input[name="approvals.0"]') as HTMLInputElement
      expect(amountInput).not.toBeNull()
      expect(amountInput).toHaveValue('420.0')
      expect(amountInput).toBeEnabled()
    })

    // Change value and save
    const amountInput = result.container.querySelector('input[name="approvals.0"]') as HTMLInputElement
    const editButton = result.getByTitle('Edit')

    act(() => {
      fireEvent.click(editButton)
      fireEvent.change(amountInput!, { target: { value: '100' } })
    })

    const saveButton = result.getByTitle('Save')
    await waitFor(() => {
      expect(saveButton).toBeEnabled()
    })

    act(() => {
      fireEvent.click(saveButton)
    })

    expect(updateCallback).toHaveBeenCalledWith(['100'])
  })
})
