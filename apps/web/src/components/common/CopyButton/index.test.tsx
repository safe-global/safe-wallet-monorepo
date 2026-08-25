import { act, fireEvent, mockClipboard, render, waitFor } from '@/tests/test-utils'
import CopyButton from '.'

describe('CopyButton', () => {
  beforeEach(() => {
    mockClipboard()
  })

  it('shows the copy icon initially', () => {
    const { getByTestId, queryByTestId } = render(<CopyButton text="0x123" />)

    expect(getByTestId('copy-btn-icon')).toBeInTheDocument()
    expect(queryByTestId('copy-btn-check')).not.toBeInTheDocument()
  })

  it('swaps to a checkmark after clicking, then reverts', async () => {
    jest.useFakeTimers()

    const { getByTestId, queryByTestId } = render(<CopyButton text="0x123" />)

    fireEvent.click(getByTestId('copy-btn-icon'))

    await waitFor(() => expect(getByTestId('copy-btn-check')).toBeInTheDocument())
    expect(queryByTestId('copy-btn-icon')).not.toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => expect(getByTestId('copy-btn-icon')).toBeInTheDocument())
    expect(queryByTestId('copy-btn-check')).not.toBeInTheDocument()

    jest.useRealTimers()
  })
})
