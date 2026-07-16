import React from 'react'
import { faker } from '@faker-js/faker'
import { TokenType } from '@safe-global/store/gateway/types'
import {
  PSEUDO_APPROVAL_VALUES,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { render, fireEvent } from '@/src/tests/test-utils'
import type { Address } from '@/src/types/address'
import { ApprovalsList, type ApprovalListItem } from './ApprovalsList'

// HashDisplay resolves display names against the active safe's address book
const initialStore = { activeSafe: { chainId: '1', address: faker.finance.ethereumAddress() as Address } }
const renderList = (ui: React.ReactElement) => render(ui, { initialStore })

const erc721TokenInfo = (): NonNullable<ApprovalInfo['tokenInfo']> => ({
  address: faker.finance.ethereumAddress(),
  symbol: 'NFT',
  decimals: 0,
  type: TokenType.ERC721,
})

const buildApproval = (overrides: Partial<ApprovalListItem> = {}): ApprovalListItem => {
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
    const { getByText } = renderList(<ApprovalsList approvals={[approval]} />)

    expect(getByText('Allow access to tokens?')).toBeTruthy()
    expect(getByText('This approval lets the spender use your tokens, limited to this amount.')).toBeTruthy()
    expect(getByText('1500 USDC')).toBeTruthy()
  })

  it('highlights unlimited approvals', () => {
    const approval = buildApproval({ amountFormatted: PSEUDO_APPROVAL_VALUES.UNLIMITED, isHighValue: true })
    const { getByText } = renderList(<ApprovalsList approvals={[approval]} />)

    expect(getByText('Unlimited')).toBeTruthy()
  })

  it('calls onEdit with the approval when the edit button is pressed', () => {
    const approval = buildApproval()
    const onEdit = jest.fn()
    const { getByTestId } = renderList(<ApprovalsList approvals={[approval]} onEdit={onEdit} />)

    fireEvent.press(getByTestId('edit-approval-button'))

    expect(onEdit).toHaveBeenCalledWith(approval)
  })

  it('hides the edit button without an onEdit handler', () => {
    const { queryByTestId } = renderList(<ApprovalsList approvals={[buildApproval()]} />)
    expect(queryByTestId('edit-approval-button')).toBeNull()
  })

  it('uses the info palette for normal approvals and warning for high-value ones', () => {
    const { getByTestId, rerender } = renderList(<ApprovalsList approvals={[buildApproval({ isHighValue: false })]} />)
    expect(getByTestId('approval-editor-info-icon')).toBeTruthy()

    rerender(<ApprovalsList approvals={[buildApproval(), buildApproval({ isHighValue: true })]} />)
    expect(getByTestId('approval-editor-warning-icon')).toBeTruthy()
  })

  it('keeps the edit button for tokens without metadata, like web', () => {
    const approval = buildApproval({ tokenInfo: undefined })
    const { queryByTestId } = renderList(<ApprovalsList approvals={[approval]} onEdit={jest.fn()} />)

    expect(queryByTestId('edit-approval-button')).toBeTruthy()
  })

  it('renders NFT approvals as a token id', () => {
    const approval = buildApproval({ tokenInfo: erc721TokenInfo(), amount: 5n, amountFormatted: '5' })
    const { getByText } = renderList(<ApprovalsList approvals={[approval]} />)

    expect(getByText('#5 NFT')).toBeTruthy()
  })

  it('renders the whole card read-only with ERC-721 wording when the batch contains an NFT approval', () => {
    const erc20Approval = buildApproval()
    const erc721Approval = buildApproval({
      tokenInfo: erc721TokenInfo(),
      transactionIndex: 1,
    })
    const { getByText, queryByTestId } = renderList(
      <ApprovalsList approvals={[erc20Approval, erc721Approval]} onEdit={jest.fn()} />,
    )

    expect(getByText('This allows the spender to transfer the specified token.')).toBeTruthy()
    expect(queryByTestId('edit-approval-button')).toBeNull()
  })
})
