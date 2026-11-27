import { faker } from '@faker-js/faker'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { render, screen } from '@/tests/test-utils'
import RejectionTxInfo from '.'

const HELP_LINK_NAME = 'Why do I need to pay to reject a transaction?'

describe('RejectionTxInfo', () => {
  it('explains that a pending rejection will replace the transactions with its nonce', () => {
    const nonce = faker.number.int({ max: 1000 })

    render(<RejectionTxInfo nonce={nonce} isTxExecuted={false} />)

    expect(screen.getByTestId('onchain-rejection')).toHaveTextContent(
      "This is an on-chain rejection that won't send any funds. " +
        `Executing this on-chain rejection will replace all currently awaiting transactions with nonce ${nonce}.`,
    )
  })

  it('explains that an executed rejection replaced the transactions with its nonce', () => {
    const nonce = faker.number.int({ max: 1000 })

    render(<RejectionTxInfo nonce={nonce} isTxExecuted />)

    expect(screen.getByTestId('onchain-rejection')).toHaveTextContent(
      "This is an on-chain rejection that didn't send any funds. " +
        `This on-chain rejection replaced all transactions with nonce ${nonce}.`,
    )
  })

  it('shows n/a when the nonce is unknown', () => {
    render(<RejectionTxInfo isTxExecuted={false} />)

    expect(screen.getByTestId('onchain-rejection')).toHaveTextContent('transactions with nonce n/a.')
  })

  it('links to the help article about paying for a rejection while it is pending', () => {
    render(<RejectionTxInfo nonce={1} isTxExecuted={false} />)

    expect(screen.getByRole('link', { name: HELP_LINK_NAME })).toHaveAttribute(
      'href',
      HelpCenterArticle.CANCELLING_TRANSACTIONS,
    )
  })

  it('hides the help link once the rejection is executed', () => {
    render(<RejectionTxInfo nonce={1} isTxExecuted />)

    expect(screen.queryByRole('link', { name: HELP_LINK_NAME })).not.toBeInTheDocument()
  })
})
