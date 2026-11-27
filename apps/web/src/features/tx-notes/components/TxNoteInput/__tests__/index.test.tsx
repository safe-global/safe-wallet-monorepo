import { fireEvent, waitFor, screen } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import TxNoteInput from '..'
import * as analytics from '@/services/analytics'
import {
  PrivateNotesPrototypeProvider,
  type PrivateNotesPrototype,
} from '../../../public/services/privateNotesPrototype'

// Mock analytics
jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))
jest.mock('@/services/analytics/events/modals', () => ({
  ...jest.requireActual('@/services/analytics/events/modals'),
  MODALS_EVENTS: {
    SUBMIT_TX_NOTE: { category: 'modals', action: 'submit_tx_note' },
  },
}))

describe('TxNoteInput', () => {
  const mockOnChange = jest.fn()

  // Helper functions to reduce code duplication
  const setupInput = () => {
    render(<TxNoteInput onChange={mockOnChange} />)
    return screen.getByLabelText('Private note') as HTMLInputElement
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

    const input = screen.getByLabelText('Private note') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('')
    expect(input).toHaveAttribute('placeholder', expect.stringMatching(/^Optional/))
    expect(screen.getByText('0/280')).toBeInTheDocument()
  })

  it('should say who reads the note and that it cannot be edited', () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    expect(screen.getByText('Private note')).toBeInTheDocument()
    expect(screen.getByTestId('tx-note-alert')).toHaveTextContent(
      'Only members of Northwind Treasury can read this. Cannot be edited after submit.',
    )
  })

  it('should call onChange when user types', async () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Private note') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'Test note' } })

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('Test note')
      expect(input).toHaveValue('Test note')
    })
  })

  it('should update character counter as user types', async () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Private note') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'Hello' } })

    await waitFor(() => {
      expect(screen.getByText('5/280')).toBeInTheDocument()
    })

    fireEvent.change(input, { target: { value: 'Hello World' } })

    await waitFor(() => {
      expect(screen.getByText('11/280')).toBeInTheDocument()
    })
  })

  it('should enforce maximum length of 280 characters', async () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Private note') as HTMLInputElement
    const longText = 'a'.repeat(300)

    fireEvent.change(input, { target: { value: longText } })

    await waitFor(() => {
      expect(input).toHaveValue('a'.repeat(280))
      expect(mockOnChange).toHaveBeenCalledWith('a'.repeat(280))
      expect(screen.getByText('280/280')).toBeInTheDocument()
    })
  })

  it('should not track analytics on focus without changes', () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Private note') as HTMLInputElement

    fireEvent.focus(input)
    fireEvent.blur(input)

    expect(analytics.trackEvent).not.toHaveBeenCalled()
  })

  it('should not track analytics when note is empty on blur', async () => {
    render(<TxNoteInput onChange={mockOnChange} />)

    const input = screen.getByLabelText('Private note') as HTMLInputElement

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

    const input = screen.getByLabelText('Private note') as HTMLInputElement

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

    const input = screen.getByLabelText('Private note') as HTMLInputElement

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
      expect(screen.getByText('0/280')).toBeInTheDocument()
    })
  })

  describe('when the proposer cannot write a note', () => {
    const renderWith = (value: Partial<PrivateNotesPrototype>) =>
      render(
        <PrivateNotesPrototypeProvider value={value}>
          <TxNoteInput onChange={mockOnChange} />
        </PrivateNotesPrototypeProvider>,
      )

    it('warns about signers outside the Workspace once there is a note to miss', () => {
      renderWith({ outsideSigners: 2 })

      expect(screen.queryByTestId('tx-note-outside-signers')).not.toBeInTheDocument()

      fireEvent.change(screen.getByLabelText('Private note'), { target: { value: 'Invoice 12' } })

      expect(screen.getByTestId('tx-note-outside-signers')).toHaveTextContent(
        '2 signers are not in this Workspace and will not see this note.',
      )
      expect(screen.getByRole('link', { name: 'Invite' })).toBeInTheDocument()
    })

    it('disables the field and asks a signed-out user to sign in', () => {
      renderWith({ access: 'signedOut' })

      expect(screen.getByRole('textbox', { name: 'Private note' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    })

    it('disables the field with an upgrade prompt when the plan has no private notes', () => {
      renderWith({ access: 'lockedPlan', planName: 'Free' })

      expect(screen.getByRole('textbox', { name: 'Private note' })).toBeDisabled()
      expect(screen.getByRole('link', { name: 'Upgrade to Pro' })).toBeInTheDocument()
      expect(screen.getByTestId('tx-note-alert')).toHaveTextContent(
        'Notes are now private and part of Safe Pro. Northwind Treasury is on Free.',
      )
    })

    it('disables the field for a Safe outside a Workspace', () => {
      renderWith({ access: 'noWorkspace' })

      expect(screen.getByRole('textbox', { name: 'Private note' })).toBeDisabled()
      expect(screen.getByRole('link', { name: 'Explore Safe Pro' })).toBeInTheDocument()
    })
  })
})
