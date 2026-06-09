import React from 'react'
import type { SessionTypes } from '@walletconnect/types'
import { render, fireEvent } from '@/src/tests/test-utils'
import { ConnectedDappRow } from '../ConnectedDappRow'

// Swipeable renders its primary child inline and exposes renderRightActions; render both so the
// trash action is queryable without driving a real gesture.
jest.mock('react-native-gesture-handler/Swipeable', () => {
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
      <ConnectedDappRow session={session('t1', 'Uniswap')} onRequestDisconnect={jest.fn()} />,
    )
    expect(getByText('Uniswap')).toBeTruthy()
  })

  it('opens the 3-dots menu and requests disconnect from it', () => {
    const onRequest = jest.fn()
    const { getByTestId, queryByTestId } = render(
      <ConnectedDappRow session={session('t1', 'Uniswap')} onRequestDisconnect={onRequest} />,
    )

    expect(queryByTestId('connected-dapp-disconnect-t1')).toBeNull()
    fireEvent.press(getByTestId('connected-dapp-menu-t1'))
    fireEvent.press(getByTestId('connected-dapp-disconnect-t1'))
    expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({ topic: 't1' }))
  })

  it('requests disconnect from the swipe-left trash action', () => {
    const onRequest = jest.fn()
    const { getByTestId } = render(<ConnectedDappRow session={session('t2', 'Aave')} onRequestDisconnect={onRequest} />)
    fireEvent.press(getByTestId('connected-dapp-trash-t2'))
    expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({ topic: 't2' }))
  })
})
