import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { render } from '@/src/tests/test-utils'
import { DappIcon } from '../DappIcon'

describe('DappIcon', () => {
  it('renders the placeholder when no URL is provided', () => {
    const { getByTestId } = render(<DappIcon />)
    expect(getByTestId('dapp-icon-placeholder')).toBeTruthy()
  })

  it('renders the image for a raster URL', () => {
    const { getByTestId, queryByTestId } = render(<DappIcon url="https://x/icon.png" />)
    expect(getByTestId('dapp-icon-image')).toBeTruthy()
    expect(queryByTestId('dapp-icon-placeholder')).toBeNull()
  })

  it('falls back to the placeholder when the image fails to load', () => {
    const { getByTestId, queryByTestId } = render(<DappIcon url="https://x/broken.png" />)
    fireEvent(getByTestId('dapp-icon-image'), 'error', { nativeEvent: { error: 'load failed' } })
    expect(getByTestId('dapp-icon-placeholder')).toBeTruthy()
    expect(queryByTestId('dapp-icon-image')).toBeNull()
  })

  it('recovers from a failure when re-rendered in place with a different URL', () => {
    // The request-sheet host re-renders this component in place when the FIFO head changes —
    // one dApp's broken icon must not blank the next dApp's valid one.
    const { getByTestId, queryByTestId, rerender } = render(<DappIcon url="https://x/broken.png" />)
    fireEvent(getByTestId('dapp-icon-image'), 'error', { nativeEvent: { error: 'load failed' } })
    expect(getByTestId('dapp-icon-placeholder')).toBeTruthy()

    rerender(<DappIcon url="https://y/valid.png" />)
    expect(getByTestId('dapp-icon-image')).toBeTruthy()
    expect(queryByTestId('dapp-icon-placeholder')).toBeNull()
  })
})
