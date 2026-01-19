import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { PositionsError } from './PositionsError'

describe('PositionsError', () => {
  it('renders error message', () => {
    render(<PositionsError onRetry={jest.fn()} />)

    expect(screen.getByText("Couldn't load positions")).toBeTruthy()
  })

  it('renders retry button', () => {
    render(<PositionsError onRetry={jest.fn()} />)

    expect(screen.getByText('Retry')).toBeTruthy()
  })

  it('calls onRetry when retry button is pressed', () => {
    const onRetry = jest.fn()
    render(<PositionsError onRetry={onRetry} />)

    fireEvent.press(screen.getByText('Retry'))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
