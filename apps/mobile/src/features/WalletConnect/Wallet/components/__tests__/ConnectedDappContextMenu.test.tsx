import React from 'react'
import { Text } from 'react-native'
import { fireEvent } from '@testing-library/react-native'
import { render } from '@/src/tests/test-utils'
import { ConnectedDappContextMenu } from '../ConnectedDappContextMenu'

// Stub the native menu: render the trigger plus a pressable per action so we can assert
// that selecting an action forwards its id to onPressAction.
jest.mock('@react-native-menu/menu', () => {
  const { Pressable, Text: RNText } = jest.requireActual('react-native')
  return {
    MenuView: ({
      children,
      actions,
      onPressAction,
    }: {
      children: React.ReactNode
      actions: { id: string; title: string }[]
      onPressAction: (event: { nativeEvent: { event: string } }) => void
    }) => (
      <>
        {children}
        {actions.map((action) => (
          <Pressable
            key={action.id}
            testID={`menu-action-${action.id}`}
            onPress={() => onPressAction({ nativeEvent: { event: action.id } })}
          >
            <RNText>{action.title}</RNText>
          </Pressable>
        ))}
      </>
    ),
  }
})

describe('ConnectedDappContextMenu', () => {
  it('renders the trigger and a Disconnect action', () => {
    const { getByText } = render(
      <ConnectedDappContextMenu onDisconnect={jest.fn()}>
        <Text>trigger</Text>
      </ConnectedDappContextMenu>,
    )

    expect(getByText('trigger')).toBeTruthy()
    expect(getByText('Disconnect')).toBeTruthy()
  })

  it('calls onDisconnect when the Disconnect action is selected', () => {
    const onDisconnect = jest.fn()
    const { getByTestId } = render(
      <ConnectedDappContextMenu onDisconnect={onDisconnect}>
        <Text>trigger</Text>
      </ConnectedDappContextMenu>,
    )

    fireEvent.press(getByTestId('menu-action-disconnect'))
    expect(onDisconnect).toHaveBeenCalledTimes(1)
  })
})
