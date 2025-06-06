import React from 'react'
import { render, fireEvent } from '@/src/tests/test-utils'
import { ContactActionButton } from '../ContactActionButton'

describe('ContactActionButton', () => {
  it('renders Save button when in editing mode', () => {
    const mockOnSave = jest.fn()
    const { getByText } = render(<ContactActionButton isEditing={true} isValid={true} onSave={mockOnSave} />)

    expect(getByText('Save contact')).toBeTruthy()
  })

  it('renders Edit button when not in editing mode', () => {
    const mockOnEdit = jest.fn()
    const { getByText } = render(
      <ContactActionButton isEditing={false} isValid={true} onEdit={mockOnEdit} onSave={jest.fn()} />,
    )

    expect(getByText('Edit contact')).toBeTruthy()
  })

  it('disables Save button when form is invalid', () => {
    const mockOnSave = jest.fn()
    const { getByText } = render(<ContactActionButton isEditing={true} isValid={false} onSave={mockOnSave} />)

    // Find button by traversing from text to its parent containers until we find the button
    let buttonElement: unknown = getByText('Save contact')
    while (buttonElement && (buttonElement as { props?: { role?: string } }).props?.role !== 'button') {
      buttonElement = (buttonElement as { parent?: unknown }).parent
    }

    expect(buttonElement).toBeTruthy()
    expect((buttonElement as { props?: { pointerEvents?: string } }).props?.pointerEvents).toBe('none')
  })

  it('calls onEdit when Edit button is pressed', () => {
    const mockOnEdit = jest.fn()
    const { getByText } = render(
      <ContactActionButton isEditing={false} isValid={true} onEdit={mockOnEdit} onSave={jest.fn()} />,
    )

    fireEvent.press(getByText('Edit contact'))
    expect(mockOnEdit).toHaveBeenCalled()
  })
})
