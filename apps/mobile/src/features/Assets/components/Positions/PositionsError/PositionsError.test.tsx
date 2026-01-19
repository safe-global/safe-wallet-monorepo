import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { PositionsError } from './PositionsError'

describe('PositionsError', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<PositionsError onRetry={jest.fn()} />)

    expect(toJSON()).toMatchSnapshot()
  })

  it('calls onRetry when retry button is pressed', () => {
    const onRetry = jest.fn()
    render(<PositionsError onRetry={onRetry} />)

    fireEvent.press(screen.getByText('Retry'))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
