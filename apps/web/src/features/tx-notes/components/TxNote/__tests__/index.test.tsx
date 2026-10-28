import { faker } from '@faker-js/faker'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { fakerChecksummedAddress, render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { multisigExecutionDetailsBuilder, transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import TxNote from '..'

const noteByProposer = (note: string, proposer: string) =>
  transactionDetailsBuilder()
    .with({
      note,
      detailedExecutionInfo: multisigExecutionDetailsBuilder()
        .with({ proposer: { value: proposer } })
        .build(),
    })
    .build()

describe('TxNote', () => {
  it('shows the transaction note as read-only text', () => {
    const note = faker.lorem.sentence()

    render(<TxNote txDetails={noteByProposer(note, fakerChecksummedAddress())} />)

    expect(screen.getByTestId('tx-note')).toHaveTextContent(note)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('credits the proposer in the note tooltip', async () => {
    const proposer = fakerChecksummedAddress()

    const { user } = renderWithUserEvent(<TxNote txDetails={noteByProposer(faker.lorem.sentence(), proposer)} />)
    await user.hover(screen.getByTestId('tx-note-tooltip'))

    expect(await screen.findByTestId('note-creator')).toHaveTextContent(shortenAddress(proposer))
  })
})
