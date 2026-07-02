import React from 'react'
import { faker } from '@faker-js/faker'
import { TokenType } from '@safe-global/store/gateway/types'
import {
  PSEUDO_APPROVAL_VALUES,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { render, fireEvent } from '@/src/tests/test-utils'
import { ApprovalsList, isEditableApproval } from './ApprovalsList'

const buildApproval = (overrides: Partial<ApprovalInfo> = {}): ApprovalInfo => {
  const tokenAddress = faker.finance.ethereumAddress()
  return {
    tokenInfo: {
      address: tokenAddress,
      symbol: 'USDC',
      decimals: 6,
      type: TokenType.ERC20,
    },
    tokenAddress,
    spender: faker.finance.ethereumAddress(),
    amount: 1_500_000_000n,
    amountFormatted: '1500',
    method: 'approve',
    transactionIndex: 0,
    ...overrides,
  }
}

describe('ApprovalsList', () => {
  it('renders the warning copy, amount and spender', () => {
    const approval = buildApproval()
    const { getByText } = render(<ApprovalsList approvals={[approval]} />)

    expect(getByText('Allow access to tokens?')).toBeTruthy()
    expect(getByText('This allows the spender to spend the specified amount of your tokens.')).toBeTruthy()
    expect(getByText('1500 USDC')).toBeTruthy()
  })

  it('highlights unlimited approvals', () => {
    const approval = buildApproval({ amountFormatted: PSEUDO_APPROVAL_VALUES.UNLIMITED })
    const { getByText } = render(<ApprovalsList approvals={[approval]} />)

    expect(getByText('Unlimited')).toBeTruthy()
  })

  it('calls onEdit with the approval when the edit button is pressed', () => {
    const approval = buildApproval()
    const onEdit = jest.fn()
    const { getByTestId } = render(<ApprovalsList approvals={[approval]} onEdit={onEdit} />)

    fireEvent.press(getByTestId('edit-approval-button'))

    expect(onEdit).toHaveBeenCalledWith(approval)
  })

  it('hides the edit button without an onEdit handler', () => {
    const { queryByTestId } = render(<ApprovalsList approvals={[buildApproval()]} />)
    expect(queryByTestId('edit-approval-button')).toBeNull()
  })

  it('hides the edit button for approvals that cannot be re-encoded', () => {
    const approval = buildApproval({ tokenInfo: undefined })
    const { queryByTestId } = render(<ApprovalsList approvals={[approval]} onEdit={jest.fn()} />)

    expect(queryByTestId('edit-approval-button')).toBeNull()
  })
})

describe('isEditableApproval', () => {
  it('is editable for ERC-20 approve and increaseAllowance', () => {
    expect(isEditableApproval(buildApproval())).toBe(true)
    expect(isEditableApproval(buildApproval({ method: 'increaseAllowance' }))).toBe(true)
  })

  it('is read-only without token info or for non-transaction methods', () => {
    expect(isEditableApproval(buildApproval({ tokenInfo: undefined }))).toBe(false)
    expect(isEditableApproval(buildApproval({ method: 'Permit2' }))).toBe(false)
  })
})
