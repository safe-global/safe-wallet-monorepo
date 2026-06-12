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
})
