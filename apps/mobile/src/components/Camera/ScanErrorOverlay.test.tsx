import React from 'react'
import { fireEvent, render } from '@/src/tests/test-utils'
import { ScanErrorOverlay } from './ScanErrorOverlay'

describe('ScanErrorOverlay', () => {
  it('renders the message and fires onTryAgain when the button is pressed', () => {
    const onTryAgain = jest.fn()
    const { getByText, getByTestId } = render(
      <ScanErrorOverlay message="Not a valid address" onTryAgain={onTryAgain} testID="scan-try-again" />,
    )

    expect(getByText('Not a valid address')).toBeTruthy()

    fireEvent.press(getByTestId('scan-try-again'))
    expect(onTryAgain).toHaveBeenCalledTimes(1)
  })
})
