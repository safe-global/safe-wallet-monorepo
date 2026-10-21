import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@/tests/test-utils'
import { collectibleBuilder } from '@/tests/builders/collectibles'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { NftTransferParams } from '..'
import SendNftBatch from '../SendNftBatch'

const RECIPIENT = '0x2222222222222222222222222222222222222222'

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  useSafeShieldForRecipients: jest.fn(),
  useSafeShieldForAddressPoisoning: jest.fn(),
}))

const tokens = [
  collectibleBuilder().with({ id: '1', tokenName: 'CatFactory', name: 'Tom' }).build(),
  collectibleBuilder().with({ id: '2', tokenName: 'CatFactory', name: 'Felix' }).build(),
]

const renderForm = () => {
  const onNext = jest.fn()
  const txFlow: TxFlowContextType<NftTransferParams> = { ...initialContext, data: { recipient: '', tokens }, onNext }
  render(
    <TxFlowContext.Provider value={txFlow as TxFlowContextType}>
      <SendNftBatch />
    </TxFlowContext.Provider>,
  )
  return { onNext }
}

describe('SendNftBatch', () => {
  it('lists the selected NFTs', () => {
    renderForm()

    expect(screen.getByText('Selected NFTs')).toBeInTheDocument()
    expect(screen.getByText('CatFactory #1')).toBeInTheDocument()
    expect(screen.getByText('Token ID: 1 - Tom')).toBeInTheDocument()
    expect(screen.getByText('CatFactory #2')).toBeInTheDocument()
    expect(screen.getByText('Token ID: 2 - Felix')).toBeInTheDocument()
  })

  it('sends the recipient and the selected NFTs to the review step', async () => {
    const { onNext } = renderForm()

    await userEvent.type(screen.getByLabelText('Recipient address', { exact: false }), RECIPIENT)
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => expect(onNext).toHaveBeenCalledWith({ recipient: RECIPIENT, tokens }))
  })

  it('does not continue without a valid recipient', async () => {
    const { onNext } = renderForm()

    await userEvent.type(screen.getByLabelText('Recipient address', { exact: false }), '0x123')
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByLabelText('Invalid address format', { exact: false })).toBeInTheDocument()
    expect(onNext).not.toHaveBeenCalled()
  })
})
