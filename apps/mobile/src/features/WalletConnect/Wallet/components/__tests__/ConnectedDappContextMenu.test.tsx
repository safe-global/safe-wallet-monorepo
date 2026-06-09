import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { render } from '@/src/tests/test-utils'
import { ConnectedDappContextMenu } from '../ConnectedDappContextMenu'

describe('ConnectedDappContextMenu', () => {
  it('disconnects when the Disconnect item is pressed', () => {
    const onDisconnect = jest.fn()
    const { getByTestId, getByText } = render(
      <ConnectedDappContextMenu
        anchor={{ x: 300, y: 120 }}
        onDisconnect={onDisconnect}
        onClose={jest.fn()}
        testID="menu-disconnect"
      />,
    )

    expect(getByText('Disconnect')).toBeTruthy()
    fireEvent.press(getByTestId('menu-disconnect'))
    expect(onDisconnect).toHaveBeenCalledTimes(1)
  })

  it('closes when the surrounding backdrop is pressed', () => {
    const onClose = jest.fn()
    const { getByLabelText } = render(
      <ConnectedDappContextMenu anchor={{ x: 300, y: 120 }} onDisconnect={jest.fn()} onClose={onClose} />,
    )

    fireEvent.press(getByLabelText('Close menu'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
