import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { render } from '@/src/tests/test-utils'
import { ConnectedDappContextMenu, getMenuPlacement } from '../ConnectedDappContextMenu'

const WINDOW = { width: 375, height: 800 }

describe('getMenuPlacement', () => {
  it('anchors below the tap when there is room', () => {
    const placement = getMenuPlacement({ x: 350, y: 120 }, WINDOW)
    expect(placement.top).toBe(128)
    expect(placement.bottom).toBeUndefined()
  })

  it('flips above the tap when anchoring below would overflow the bottom', () => {
    const placement = getMenuPlacement({ x: 350, y: 780 }, WINDOW)
    expect(placement.top).toBeUndefined()
    expect(placement.bottom).toBe(WINDOW.height - 780 + 8)
  })

  it('right-aligns to the tap and clamps to a 16px gutter', () => {
    expect(getMenuPlacement({ x: 300, y: 100 }, WINDOW).right).toBe(75)
    expect(getMenuPlacement({ x: 374, y: 100 }, WINDOW).right).toBe(16)
  })
})

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
