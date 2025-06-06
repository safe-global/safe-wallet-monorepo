import React from 'react'
import { render, fireEvent } from '@/src/tests/test-utils'
import { NetworkSelector } from '../NetworkSelector'

const mockOnClose = jest.fn()
const mockOnSelectionChange = jest.fn()

describe('NetworkSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the modal content when visible', () => {
    const { getByText } = render(
      <NetworkSelector
        isVisible={true}
        onClose={mockOnClose}
        onSelectionChange={mockOnSelectionChange}
        selectedChainIds={[]}
      />,
    )

    expect(getByText('Select Networks')).toBeTruthy()
    expect(getByText('All Networks')).toBeTruthy()
    expect(getByText('Contact available on all supported networks')).toBeTruthy()
  })

  it('shows correct status when no chains are selected', () => {
    const { getByText } = render(
      <NetworkSelector
        isVisible={true}
        onClose={mockOnClose}
        onSelectionChange={mockOnSelectionChange}
        selectedChainIds={[]}
      />,
    )

    expect(getByText('Contact available on all networks')).toBeTruthy()
  })

  it('shows correct status when specific chains are selected', () => {
    const { getByText } = render(
      <NetworkSelector
        isVisible={true}
        onClose={mockOnClose}
        onSelectionChange={mockOnSelectionChange}
        selectedChainIds={['1', '137']}
      />,
    )

    expect(getByText('Contact available on 2 networks')).toBeTruthy()
  })

  it('calls onSelectionChange when all networks is selected', () => {
    const { getByText } = render(
      <NetworkSelector
        isVisible={true}
        onClose={mockOnClose}
        onSelectionChange={mockOnSelectionChange}
        selectedChainIds={['1', '137']}
      />,
    )

    fireEvent.press(getByText('All Networks'))
    expect(mockOnSelectionChange).toHaveBeenCalledWith([])
  })

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <NetworkSelector
        isVisible={false}
        onClose={mockOnClose}
        onSelectionChange={mockOnSelectionChange}
        selectedChainIds={[]}
      />,
    )

    expect(queryByText('Select Networks')).toBeNull()
  })
})
