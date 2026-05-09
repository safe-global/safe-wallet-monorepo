import { fireEvent, waitFor, screen } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import TxNoteInput from '..'
import * as analytics from '@/services/analytics'

// Mock analytics
jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  MODALS_EVENTS: {
    SUBMIT_TX_NOTE: { category: 'modals', action: 'submit_tx_note' },
  },
}))

describe('TxNoteInput', () => {
  const mockOnChange = jest.fn()

  // Helper functions to reduce code duplication
  const setupInput = () => {
    render(<TxNoteInput onChange={mockOnChange} />)
    return screen.getByLabelText('Optional') as HTMLInputElement
  }

  const changeAndBlur = (input: HTMLInputElement, value: string) => {
    fireEvent.change(input, { target: { value } })
    fireEvent.blur(input)
  }

  const expectTrackEventCalls = async (count: number) => {
    await waitFor(() => {
      expect(analytics.trackEvent).toHaveBeenCalledTimes(count)
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with default empty value', () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Optional') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('')
    expect(screen.getByText('0/60')).toBeInTheDocument()
  })

  it('should display note heading and privacy warning', () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByTestId('tx-note-alert')).toHaveTextContent(
      'Notes are publicly visible. Do not share any private or sensitive details.',
    )
  })

  it('should call onChange when user types', async () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Optional') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'Test note' } })

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('Test note')
      expect(input).toHaveValue('Test note')
    })
  })

  it('should update character counter as user types', async () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Optional') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'Hello' } })

    await waitFor(() => {
      expect(screen.getByText('5/60')).toBeInTheDocument()
    })

    fireEvent.change(input, { target: { value: 'Hello World' } })

    await waitFor(() => {
      expect(screen.getByText('11/60')).toBeInTheDocument()
    })
  })

  it('should enforce maximum length of 60 characters', async () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Optional') as HTMLInputElement
    const longText = 'a'.repeat(100) // Try to enter 100 characters

    fireEvent.change(input, { target: { value: longText } })

    await waitFor(() => {
      expect(input).toHaveValue('a'.repeat(60))
      expect(mockOnChange).toHaveBeenCalledWith('a'.repeat(60))
      expect(screen.getByText('60/60')).toBeInTheDocument()
    })
  })

  it('should not track analytics on focus without changes', () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Optional') as HTMLInputElement

    fireEvent.focus(input)
    fireEvent.blur(input)

    expect(analytics.trackEvent).not.toHaveBeenCalled()
  })

  it('should not track analytics when note is empty on blur', async () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Optional') as HTMLInputElement

    // Type and then clear
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(analytics.trackEvent).not.toHaveBeenCalled()
    })
  })

  it('should track analytics when note is changed and non-empty on blur', async () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Optional') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'Test note' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(analytics.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'modals',
          action: 'submit_tx_note',
        }),
      )
    })
  })

  it('should reset isDirty state on focus', async () => {
    const input = setupInput()

    // First change and blur
    changeAndBlur(input, 'First note')
    await expectTrackEventCalls(1)

    // Focus again (should reset isDirty)
    fireEvent.focus(input)

    // Blur without changes (should not track again)
    fireEvent.blur(input)

    await expectTrackEventCalls(1) // Still 1, not 2
  })

  it('should track analytics again after refocusing and making new changes', async () => {
    const input = setupInput()

    // First change and blur
    changeAndBlur(input, 'First')
    await expectTrackEventCalls(1)

    // Focus and make another change
    fireEvent.focus(input)
    changeAndBlur(input, 'First Second')

    await expectTrackEventCalls(2)
  })

  it('should allow clearing the input', async () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Optional') as HTMLInputElement

    // Add text
    fireEvent.change(input, { target: { value: 'Some text' } })

    await waitFor(() => {
      expect(input).toHaveValue('Some text')
    })

    // Clear it
    fireEvent.change(input, { target: { value: '' } })

    await waitFor(() => {
      expect(input).toHaveValue('')
      expect(mockOnChange).toHaveBeenCalledWith('')
      expect(screen.getByText('0/60')).toBeInTheDocument()
    })
  })
})
