import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { ManageTokensSheet } from './ManageTokensSheet'

describe('ManageTokensSheet', () => {
  const mockOnToggleHideSuspicious = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the sheet with description', () => {
    render(<ManageTokensSheet hideSuspicious={true} onToggleHideSuspicious={mockOnToggleHideSuspicious} />)

    expect(screen.getByText('Choose which tokens to display in your assets list.')).toBeTruthy()
  })

  it('should render the switch with correct label', () => {
    render(<ManageTokensSheet hideSuspicious={true} onToggleHideSuspicious={mockOnToggleHideSuspicious} />)

    expect(screen.getByText(/Hide suspicious token/)).toBeTruthy()
    expect(screen.getByTestId('toggle-hide-suspicious-tokens')).toBeTruthy()
  })

  it('should show switch as ON when hideSuspicious is true', () => {
    render(<ManageTokensSheet hideSuspicious={true} onToggleHideSuspicious={mockOnToggleHideSuspicious} />)

    const switchElement = screen.getByTestId('toggle-hide-suspicious-tokens')
    expect(switchElement.props.value).toBe(true)
  })

  it('should show switch as OFF when hideSuspicious is false', () => {
    render(<ManageTokensSheet hideSuspicious={false} onToggleHideSuspicious={mockOnToggleHideSuspicious} />)

    const switchElement = screen.getByTestId('toggle-hide-suspicious-tokens')
    expect(switchElement.props.value).toBe(false)
  })

  it('should call onToggleHideSuspicious when switch is toggled', () => {
    render(<ManageTokensSheet hideSuspicious={true} onToggleHideSuspicious={mockOnToggleHideSuspicious} />)

    const switchElement = screen.getByTestId('toggle-hide-suspicious-tokens')
    fireEvent(switchElement, 'valueChange', false)

    expect(mockOnToggleHideSuspicious).toHaveBeenCalledTimes(1)
  })
})
