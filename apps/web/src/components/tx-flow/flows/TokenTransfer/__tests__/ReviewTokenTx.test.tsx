import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import { initialContext, TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { type MultiTokenTransferParams, TokenTransferType } from '@/components/tx-flow/flows/TokenTransfer'
import ReviewTokenTx from '../ReviewTokenTx'

jest.mock('@/components/tx-flow/flows/TokenTransfer/ReviewTokenTransfer', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(() => ({
    ReviewSpendingLimitTx: () => <div>Spending limit review</div>,
  })),
}))

const transferOfType = (type: TokenTransferType): MultiTokenTransferParams => ({
  type,
  recipients: [
    {
      recipient: fakerChecksummedAddress(),
      tokenAddress: ZERO_ADDRESS,
      amount: faker.finance.amount({ min: 0.001, max: 1 }),
    },
  ],
})

const renderReview = (data: MultiTokenTransferParams) =>
  render(
    <TxFlowContext.Provider value={{ ...initialContext, data }}>
      <ReviewTokenTx onSubmit={jest.fn()}>
        <span>Note field</span>
      </ReviewTokenTx>
    </TxFlowContext.Provider>,
  )

describe('ReviewTokenTx', () => {
  it('leaves out the note field on a spending-limit transfer', () => {
    renderReview(transferOfType(TokenTransferType.spendingLimit))

    expect(screen.getByText('Spending limit review')).toBeInTheDocument()
    expect(screen.queryByText('Note field')).not.toBeInTheDocument()
  })

  it('shows the note field on a standard transfer', () => {
    renderReview(transferOfType(TokenTransferType.multiSig))

    expect(screen.getByText('Note field')).toBeInTheDocument()
  })
})
