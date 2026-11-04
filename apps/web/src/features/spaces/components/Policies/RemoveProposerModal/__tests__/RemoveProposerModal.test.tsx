import { fireEvent, render, screen } from '@/tests/test-utils'
import RemoveProposerModal from '../index'

describe('RemoveProposerModal', () => {
  it('should, when open, ask to confirm and explain that a signature is needed', () => {
    render(<RemoveProposerModal open onClose={jest.fn()} onConfirm={jest.fn()} />)

    expect(screen.getByText('Remove this proposer?')).toBeInTheDocument()
    expect(screen.getByText(/won't be able to suggest transactions anymore/)).toBeInTheDocument()
    expect(screen.getByText(/confirm it with a signature on your connected wallet/)).toBeInTheDocument()
  })

  it('should, when closed, render nothing', () => {
    render(<RemoveProposerModal open={false} onClose={jest.fn()} onConfirm={jest.fn()} />)

    expect(screen.queryByTestId('remove-proposer-modal')).not.toBeInTheDocument()
  })

  it('should, when No, keep it is clicked, close without confirming', () => {
    const onClose = jest.fn()
    const onConfirm = jest.fn()

    render(<RemoveProposerModal open onClose={onClose} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByRole('button', { name: 'No, keep it' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('should, when the close icon is clicked, close without confirming', () => {
    const onClose = jest.fn()
    const onConfirm = jest.fn()

    render(<RemoveProposerModal open onClose={onClose} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByTestId('modal-dialog-close-btn'))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('should, when Yes, delete is clicked, confirm', () => {
    const onConfirm = jest.fn()

    render(<RemoveProposerModal open onClose={jest.fn()} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should, while removing, disable both actions', () => {
    render(<RemoveProposerModal open onClose={jest.fn()} onConfirm={jest.fn()} isRemoving />)

    expect(screen.getByTestId('remove-proposer-cancel')).toBeDisabled()
    expect(screen.getByTestId('remove-proposer-confirm')).toBeDisabled()
  })

  it('should, when the removal failed, show why', () => {
    render(<RemoveProposerModal open onClose={jest.fn()} onConfirm={jest.fn()} error="Invalid signature" />)

    expect(screen.getByText('Invalid signature')).toBeInTheDocument()
  })
})
