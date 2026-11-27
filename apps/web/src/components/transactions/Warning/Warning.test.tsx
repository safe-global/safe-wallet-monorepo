import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation } from '@safe-global/store/gateway/types'
import { faker } from '@faker-js/faker'
import { render, screen } from '@/tests/test-utils'
import { DelegateCallWarning } from '.'

const WARNING_TEST_ID = 'delegate-call-warning'

const buildTxData = (overrides: Partial<TransactionData>): TransactionData => ({
  operation: Operation.DELEGATE,
  trustedDelegateCallTarget: true,
  to: { value: faker.finance.ethereumAddress() },
  value: '0',
  ...overrides,
})

describe('DelegateCallWarning', () => {
  it.each([
    { target: 'trusted', trustedDelegateCallTarget: true, text: 'Delegate call' },
    { target: 'untrusted', trustedDelegateCallTarget: false, text: 'Unexpected delegate call' },
  ])('labels a delegate call to a $target target "$text"', ({ trustedDelegateCallTarget, text }) => {
    render(<DelegateCallWarning showWarning txData={buildTxData({ trustedDelegateCallTarget })} />)

    expect(screen.getByTestId(WARNING_TEST_ID)).toHaveTextContent(text)
  })

  it('shows a trusted delegate call even when warnings are off', () => {
    render(<DelegateCallWarning showWarning={false} txData={buildTxData({ trustedDelegateCallTarget: true })} />)

    expect(screen.getByTestId(WARNING_TEST_ID)).toHaveTextContent('Delegate call')
  })

  it('hides an untrusted delegate call when warnings are off', () => {
    render(<DelegateCallWarning showWarning={false} txData={buildTxData({ trustedDelegateCallTarget: false })} />)

    expect(screen.queryByTestId(WARNING_TEST_ID)).not.toBeInTheDocument()
  })

  it('shows nothing for a regular call', () => {
    render(<DelegateCallWarning showWarning txData={buildTxData({ operation: Operation.CALL })} />)

    expect(screen.queryByTestId(WARNING_TEST_ID)).not.toBeInTheDocument()
  })
})
