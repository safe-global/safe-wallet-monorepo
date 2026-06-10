import React from 'react'
import type { SessionTypes } from '@walletconnect/types'
import { render, fireEvent } from '@/src/tests/test-utils'
import { ConnectedDappRow } from '../ConnectedDappRow'

// ReanimatedSwipeable renders its primary child inline and exposes renderRightActions; render
// both so the trash action is queryable without driving a real gesture.
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const react = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')
  return react.forwardRef(
    (
      { children, renderRightActions }: { children: React.ReactNode; renderRightActions?: () => React.ReactNode },
      ref: React.Ref<unknown>,
    ) => {
      react.useImperativeHandle(ref, () => ({ close: jest.fn() }))
      return (
        <View>
          {children}
          {renderRightActions ? renderRightActions() : null}
        </View>
      )
    },
  )
})

const session = (topic: string, name: string): SessionTypes.Struct =>
  ({ topic, peer: { metadata: { name, url: `https://${name}.test`, icons: [] } } }) as unknown as SessionTypes.Struct

describe('ConnectedDappRow', () => {
  it('renders the dApp name', () => {
    const { getByText } = render(
      <ConnectedDappRow session={session('t1', 'Uniswap')} onOpenMenu={jest.fn()} onRequestDisconnect={jest.fn()} />,
    )
    expect(getByText('Uniswap')).toBeTruthy()
  })

  it('opens the overflow menu anchored at the tapped point', () => {
    const onOpenMenu = jest.fn()
    const { getByTestId } = render(
      <ConnectedDappRow session={session('t1', 'Uniswap')} onOpenMenu={onOpenMenu} onRequestDisconnect={jest.fn()} />,
    )

    fireEvent.press(getByTestId('connected-dapp-menu-t1'), { nativeEvent: { pageX: 300, pageY: 120 } })
    expect(onOpenMenu).toHaveBeenCalledWith(expect.objectContaining({ topic: 't1' }), { x: 300, y: 120 })
  })

  it('requests disconnect from the swipe-left trash action', () => {
    const onRequest = jest.fn()
    const { getByTestId } = render(
      <ConnectedDappRow session={session('t2', 'Aave')} onOpenMenu={jest.fn()} onRequestDisconnect={onRequest} />,
    )
    fireEvent.press(getByTestId('connected-dapp-trash-t2'))
    expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({ topic: 't2' }))
  })
})
