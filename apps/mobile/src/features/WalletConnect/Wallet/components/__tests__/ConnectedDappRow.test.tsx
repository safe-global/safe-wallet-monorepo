import React from 'react'
import type { SessionTypes } from '@walletconnect/types'
import { render, fireEvent } from '@/src/tests/test-utils'
import { ConnectedDappRow } from '../ConnectedDappRow'

// ReanimatedSwipeable renders its primary child inline and exposes renderRightActions; render
// both so the trash action is queryable without driving a real gesture. Pressables stand in for
// the open-drag gesture (a 'left' drag reveals the right-side actions; 'right' reveals nothing).
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const react = jest.requireActual('react')
  const { View, Pressable } = jest.requireActual('react-native')
  const Swipeable = react.forwardRef(
    (
      {
        children,
        renderRightActions,
        onSwipeableOpenStartDrag,
      }: {
        children: React.ReactNode
        renderRightActions?: () => React.ReactNode
        onSwipeableOpenStartDrag?: (direction: 'left' | 'right') => void
      },
      ref: React.Ref<unknown>,
    ) => {
      react.useImperativeHandle(ref, () => ({ close: jest.fn() }))
      return (
        <View>
          {children}
          {renderRightActions ? renderRightActions() : null}
          <Pressable testID="swipe-open-drag-left" onPress={() => onSwipeableOpenStartDrag?.('left')} />
          <Pressable testID="swipe-open-drag-right" onPress={() => onSwipeableOpenStartDrag?.('right')} />
        </View>
      )
    },
  )
  return { __esModule: true, default: Swipeable, SwipeDirection: { LEFT: 'left', RIGHT: 'right' } }
})

// Stub the native menu: render the trigger plus a pressable per action so the disconnect action
// is selectable without the native menu internals.
jest.mock('@react-native-menu/menu', () => {
  const { Pressable } = jest.requireActual('react-native')
  return {
    MenuView: ({
      children,
      actions,
      onPressAction,
    }: {
      children: React.ReactNode
      actions: { id: string }[]
      onPressAction: (event: { nativeEvent: { event: string } }) => void
    }) => (
      <>
        {children}
        {actions.map((action) => (
          <Pressable
            key={action.id}
            testID={`menu-action-${action.id}`}
            onPress={() => onPressAction({ nativeEvent: { event: action.id } })}
          />
        ))}
      </>
    ),
  }
})

const session = (topic: string, name: string): SessionTypes.Struct =>
  ({ topic, peer: { metadata: { name, url: `https://${name}.test`, icons: [] } } }) as unknown as SessionTypes.Struct

describe('ConnectedDappRow', () => {
  it('renders the dApp name', () => {
    const { getByText } = render(
      <ConnectedDappRow session={session('t1', 'Uniswap')} onRequestDisconnect={jest.fn()} />,
    )
    expect(getByText('Uniswap')).toBeTruthy()
  })

  it('requests disconnect from the overflow menu', () => {
    const onRequest = jest.fn()
    const { getByTestId } = render(
      <ConnectedDappRow session={session('t1', 'Uniswap')} onRequestDisconnect={onRequest} />,
    )

    fireEvent.press(getByTestId('menu-action-disconnect'))
    expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({ topic: 't1' }))
  })

  it('requests disconnect from the swipe-left trash action', () => {
    const onRequest = jest.fn()
    const { getByTestId } = render(<ConnectedDappRow session={session('t2', 'Aave')} onRequestDisconnect={onRequest} />)
    fireEvent.press(getByTestId('connected-dapp-trash-t2'))
    expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({ topic: 't2' }))
  })

  it('notifies onSwipeOpenStart with its swipeable handle when a left drag starts to reveal the trash', () => {
    const onSwipeOpenStart = jest.fn()
    const { getByTestId } = render(
      <ConnectedDappRow
        session={session('t3', 'Curve')}
        onRequestDisconnect={jest.fn()}
        onSwipeOpenStart={onSwipeOpenStart}
      />,
    )
    fireEvent.press(getByTestId('swipe-open-drag-left'))
    expect(onSwipeOpenStart).toHaveBeenCalledWith(expect.objectContaining({ close: expect.any(Function) }))
  })

  it('ignores a right drag — there are no left-side actions to reveal', () => {
    const onSwipeOpenStart = jest.fn()
    const { getByTestId } = render(
      <ConnectedDappRow
        session={session('t3', 'Curve')}
        onRequestDisconnect={jest.fn()}
        onSwipeOpenStart={onSwipeOpenStart}
      />,
    )
    fireEvent.press(getByTestId('swipe-open-drag-right'))
    expect(onSwipeOpenStart).not.toHaveBeenCalled()
  })
})
