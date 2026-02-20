import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { ManageTokensSheet } from './ManageTokensSheet'

describe('ManageTokensSheet', () => {
  const mockOnToggleShowAllTokens = jest.fn()
  const mockOnToggleHideDust = jest.fn()

  const defaultProps = {
    showAllTokens: false,
    onToggleShowAllTokens: mockOnToggleShowAllTokens,
    hideDust: true,
    onToggleHideDust: mockOnToggleHideDust,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the sheet with description', () => {
    render(<ManageTokensSheet {...defaultProps} />)

    expect(screen.getByText('Choose which tokens to display in your assets list.')).toBeTruthy()
  })

  it('should render the "Show all tokens" toggle', () => {
    render(<ManageTokensSheet {...defaultProps} />)

    expect(screen.getByText('Show all tokens')).toBeTruthy()
    expect(screen.getByTestId('toggle-show-all-tokens')).toBeTruthy()
  })

  it('should render the "Hide small balances" toggle', () => {
    render(<ManageTokensSheet {...defaultProps} />)

    expect(screen.getByText('Hide small balances')).toBeTruthy()
    expect(screen.getByTestId('toggle-hide-small-balances')).toBeTruthy()
  })

  it('should show "Show all tokens" as OFF when showAllTokens is false', () => {
    render(<ManageTokensSheet {...defaultProps} />)

    const switchElement = screen.getByTestId('toggle-show-all-tokens')
    expect(switchElement.props.value).toBe(false)
  })

  it('should show "Show all tokens" as ON when showAllTokens is true', () => {
    render(<ManageTokensSheet {...defaultProps} showAllTokens={true} />)

    const switchElement = screen.getByTestId('toggle-show-all-tokens')
    expect(switchElement.props.value).toBe(true)
  })

  it('should show "Hide small balances" as ON when hideDust is true', () => {
    render(<ManageTokensSheet {...defaultProps} />)

    const switchElement = screen.getByTestId('toggle-hide-small-balances')
    expect(switchElement.props.value).toBe(true)
  })

  it('should show "Hide small balances" as OFF when hideDust is false', () => {
    render(<ManageTokensSheet {...defaultProps} hideDust={false} />)

    const switchElement = screen.getByTestId('toggle-hide-small-balances')
    expect(switchElement.props.value).toBe(false)
  })

  it('should call onToggleShowAllTokens when "Show all tokens" is toggled', () => {
    render(<ManageTokensSheet {...defaultProps} />)

    const switchElement = screen.getByTestId('toggle-show-all-tokens')
    fireEvent(switchElement, 'valueChange', true)

    expect(mockOnToggleShowAllTokens).toHaveBeenCalledTimes(1)
  })

  it('should call onToggleHideDust when "Hide small balances" is toggled', () => {
    render(<ManageTokensSheet {...defaultProps} />)

    const switchElement = screen.getByTestId('toggle-hide-small-balances')
    fireEvent(switchElement, 'valueChange', false)

    expect(mockOnToggleHideDust).toHaveBeenCalledTimes(1)
  })
})
