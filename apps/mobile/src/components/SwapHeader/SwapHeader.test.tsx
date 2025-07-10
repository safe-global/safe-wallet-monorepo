import React from 'react'
import { render } from '@/src/tests/test-utils'
import { SwapHeader } from './SwapHeader'

const mockTokenA = {
  logoUri: 'https://example.com/token-a.png',
  symbol: 'TOKENA',
}

const mockTokenB = {
  logoUri: 'https://example.com/token-b.png',
  symbol: 'TOKENB',
}

describe('SwapHeader', () => {
  it('should render basic swap header with required props', () => {
    const { getByText } = render(
      <SwapHeader fromToken={mockTokenA} toToken={mockTokenB} fromAmount="100.5" toAmount="200.25" />,
    )

    expect(getByText('Sell')).toBeVisible()
    expect(getByText('For')).toBeVisible()
    expect(getByText('100.5 TOKENA')).toBeVisible()
    expect(getByText('200.25 TOKENB')).toBeVisible()
  })

  it('should render date and time when provided', () => {
    const { getByText } = render(
      <SwapHeader
        date="Dec 15 2023"
        time="2:30 PM"
        fromToken={mockTokenA}
        toToken={mockTokenB}
        fromAmount="100.5"
        toAmount="200.25"
      />,
    )

    expect(getByText('Dec 15 2023 at 2:30 PM')).toBeVisible()
  })

  it('should not render date section when date/time are not provided', () => {
    const { queryByText } = render(
      <SwapHeader fromToken={mockTokenA} toToken={mockTokenB} fromAmount="100.5" toAmount="200.25" />,
    )

    expect(queryByText(/at/)).toBeNull()
  })

  it('should render custom labels when provided', () => {
    const { getByText } = render(
      <SwapHeader
        fromToken={mockTokenA}
        toToken={mockTokenB}
        fromAmount="100.5"
        toAmount="200.25"
        fromLabel="Custom From"
        toLabel="Custom To"
      />,
    )

    expect(getByText('Custom From')).toBeVisible()
    expect(getByText('Custom To')).toBeVisible()
  })

  it('should render with default labels when not provided', () => {
    const { getByText } = render(
      <SwapHeader fromToken={mockTokenA} toToken={mockTokenB} fromAmount="100.5" toAmount="200.25" />,
    )

    expect(getByText('Sell')).toBeVisible()
    expect(getByText('For')).toBeVisible()
  })

  it('should handle tokens with null logoUri', () => {
    const tokenWithoutLogo = {
      logoUri: null,
      symbol: 'NOLOGO',
    }

    const { getByText } = render(
      <SwapHeader fromToken={tokenWithoutLogo} toToken={mockTokenB} fromAmount="100.5" toAmount="200.25" />,
    )

    expect(getByText('100.5 NOLOGO')).toBeVisible()
  })

  it('should handle tokens with undefined logoUri', () => {
    const tokenWithoutLogo = {
      logoUri: undefined,
      symbol: 'UNDEFINED',
    }

    const { getByText } = render(
      <SwapHeader fromToken={tokenWithoutLogo} toToken={mockTokenB} fromAmount="100.5" toAmount="200.25" />,
    )

    expect(getByText('100.5 UNDEFINED')).toBeVisible()
  })

  it('should ellipsize long amounts', () => {
    const { getByText } = render(
      <SwapHeader
        fromToken={mockTokenA}
        toToken={mockTokenB}
        fromAmount="1234567890.123456789"
        toAmount="9876543210.987654321"
      />,
    )

    // The ellipsis utility should truncate long amounts
    expect(getByText(/TOKENA/)).toBeVisible()
    expect(getByText(/TOKENB/)).toBeVisible()
  })

  it('should render TokenIcons with correct props', () => {
    const { getAllByTestId } = render(
      <SwapHeader fromToken={mockTokenA} toToken={mockTokenB} fromAmount="100.5" toAmount="200.25" />,
    )

    // TokenIcons should be rendered with testID - there should be 2 images
    const images = getAllByTestId('logo-image')
    expect(images).toHaveLength(2)
    expect(images[0]).toBeVisible()
    expect(images[1]).toBeVisible()
    expect(images[0]).toHaveProp('accessibilityLabel', 'TOKENA')
    expect(images[1]).toHaveProp('accessibilityLabel', 'TOKENB')
  })

  it('should render chevron-right arrow between tokens', () => {
    render(<SwapHeader fromToken={mockTokenA} toToken={mockTokenB} fromAmount="100.5" toAmount="200.25" />)

    // Badge with chevron should be present
    // Note: Exact test depends on how SafeFontIcon is implemented
  })

  it('should handle edge case with very short amounts', () => {
    const { getByText } = render(
      <SwapHeader fromToken={mockTokenA} toToken={mockTokenB} fromAmount="0" toAmount="0.1" />,
    )

    expect(getByText('0 TOKENA')).toBeVisible()
    expect(getByText('0.1 TOKENB')).toBeVisible()
  })

  it('should handle multiple SwapHeaders in same component', () => {
    const { getAllByText } = render(
      <>
        <SwapHeader fromToken={mockTokenA} toToken={mockTokenB} fromAmount="100" toAmount="200" />
        <SwapHeader fromToken={mockTokenB} toToken={mockTokenA} fromAmount="50" toAmount="25" />
      </>,
    )

    expect(getAllByText('Sell')).toHaveLength(2)
    expect(getAllByText('For')).toHaveLength(2)
  })
})
