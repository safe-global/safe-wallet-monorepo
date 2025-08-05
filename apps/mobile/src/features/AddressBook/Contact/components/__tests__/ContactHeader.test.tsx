import React from 'react'
import { render } from '@/src/tests/test-utils'
import { ContactHeader } from '../ContactHeader'

describe('ContactHeader', () => {
  const mockDisplayName = 'John Doe'
  const mockDisplayAddress = '0x1234567890123456789012345678901234567890'

  it('should render contact name correctly', () => {
    const { getByText } = render(<ContactHeader displayName={mockDisplayName} displayAddress={mockDisplayAddress} />)

    expect(getByText(mockDisplayName)).toBeTruthy()
  })

  it('should render Identicon when displayAddress is provided', () => {
    const { getByTestId } = render(<ContactHeader displayName={mockDisplayName} displayAddress={mockDisplayAddress} />)

    // Identicon component should be rendered when address is provided
    expect(getByTestId('identicon-image-container')).toBeTruthy()
  })

  it('should render default icon when displayAddress is not provided', () => {
    const { queryByTestId, getByText } = render(<ContactHeader displayName={mockDisplayName} />)

    // Identicon should not be rendered when no address is provided
    expect(queryByTestId('identicon-image-container')).toBeFalsy()

    // Should still render the display name
    expect(getByText(mockDisplayName)).toBeTruthy()
  })

  it('should render display name', () => {
    const { getByText } = render(<ContactHeader displayName={mockDisplayName} displayAddress={mockDisplayAddress} />)

    const nameElement = getByText(mockDisplayName)
    expect(nameElement).toBeTruthy()
  })

  it('should render without address and still display name', () => {
    const { getByText, queryByTestId } = render(<ContactHeader displayName={mockDisplayName} />)

    expect(getByText(mockDisplayName)).toBeTruthy()
    expect(queryByTestId('identicon-image-container')).toBeFalsy()
  })
})
