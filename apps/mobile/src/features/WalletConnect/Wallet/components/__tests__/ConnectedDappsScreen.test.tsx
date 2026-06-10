import React from 'react'
import type { SessionTypes } from '@walletconnect/types'
import { renderWithStore, createTestStore, fireEvent, act } from '@/src/tests/test-utils'
import { ConnectedDappsScreen } from '../ConnectedDappsScreen'

const mockDisconnect = jest.fn()
let mockBusyTopic: string | null = null
jest.mock('../../hooks/useDisconnectSession', () => ({
  useDisconnectSession: () => ({ disconnect: mockDisconnect, busyTopic: mockBusyTopic }),
}))

// Stub the row: expose a menu trigger (reports an anchor) and a swipe trigger, so the screen's
// menu + selection wiring is observable without the swipe/gesture internals.
jest.mock('../ConnectedDappRow', () => {
  const { Text } = jest.requireActual('react-native')
  return {
    ConnectedDappRow: ({
      session,
      onOpenMenu,
      onRequestDisconnect,
    }: {
      session: { topic: string; peer: { metadata: { name: string } } }
      onOpenMenu: (s: unknown, anchor: { x: number; y: number }) => void
      onRequestDisconnect: (s: unknown) => void
    }) => (
      <>
        <Text testID={`row-menu-${session.topic}`} onPress={() => onOpenMenu(session, { x: 0, y: 0 })}>
          {session.peer.metadata.name}
        </Text>
        <Text testID={`row-swipe-${session.topic}`} onPress={() => onRequestDisconnect(session)}>
          swipe
        </Text>
      </>
    ),
  }
})

// Stub the menu: surface the screen-provided testID + a close trigger so we can assert which
// session's menu is open and that only one is open at a time.
jest.mock('../ConnectedDappContextMenu', () => {
  const { Text, View } = jest.requireActual('react-native')
  return {
    ConnectedDappContextMenu: ({
      testID,
      onDisconnect,
      onClose,
    }: {
      testID?: string
      onDisconnect: () => void
      onClose: () => void
    }) => (
      <View testID="context-menu">
        <Text testID={testID} onPress={onDisconnect}>
          Disconnect
        </Text>
        <Text testID="menu-close" onPress={onClose}>
          close
        </Text>
      </View>
    ),
  }
})

// Stub the confirm sheet: render the pending dApp name + an inline confirm trigger.
jest.mock('../DisconnectConfirmModal', () => {
  const { Text, View } = jest.requireActual('react-native')
  return {
    DisconnectConfirmModal: ({ dapp, onConfirm }: { dapp: { name: string } | null; onConfirm: () => void }) =>
      dapp ? (
        <View testID="confirm-modal">
          <Text>{`confirm:${dapp.name}`}</Text>
          <Text testID="confirm-action" onPress={onConfirm}>
            confirm
          </Text>
        </View>
      ) : null,
  }
})

const session = (topic: string, name: string): SessionTypes.Struct =>
  ({ topic, peer: { metadata: { name, url: `https://${name}.test`, icons: [] } } }) as unknown as SessionTypes.Struct

const storeWith = (sessions: SessionTypes.Struct[]) =>
  createTestStore({
    walletKit: {
      sessions: Object.fromEntries(sessions.map((s) => [s.topic, s])),
      verifyByTopic: {},
      pending: [],
      outstandingRequests: {},
    },
  } as never)

describe('ConnectedDappsScreen', () => {
  beforeEach(() => {
    mockDisconnect.mockReset().mockResolvedValue(true)
    mockBusyTopic = null
  })

  it('renders the title and the empty state when there are no sessions', () => {
    const { getByText } = renderWithStore(<ConnectedDappsScreen />, storeWith([]))
    expect(getByText('Connected apps')).toBeTruthy()
    expect(getByText('No connected apps.')).toBeTruthy()
  })

  it('renders a row per connected dApp', () => {
    const { getByTestId } = renderWithStore(
      <ConnectedDappsScreen />,
      storeWith([session('t1', 'Uniswap'), session('t2', 'Aave')]),
    )
    expect(getByTestId('row-menu-t1')).toBeTruthy()
    expect(getByTestId('row-menu-t2')).toBeTruthy()
  })

  it('keeps only one menu open at a time', () => {
    const { getByTestId, queryByTestId } = renderWithStore(
      <ConnectedDappsScreen />,
      storeWith([session('t1', 'Uniswap'), session('t2', 'Aave')]),
    )

    fireEvent.press(getByTestId('row-menu-t1'))
    expect(getByTestId('connected-dapp-disconnect-t1')).toBeTruthy()

    fireEvent.press(getByTestId('row-menu-t2'))
    expect(queryByTestId('connected-dapp-disconnect-t1')).toBeNull()
    expect(getByTestId('connected-dapp-disconnect-t2')).toBeTruthy()
  })

  it('opens the confirm sheet from the menu and disconnects the selected dApp', async () => {
    const { getByTestId, getByText, queryByTestId } = renderWithStore(
      <ConnectedDappsScreen />,
      storeWith([session('t1', 'Uniswap')]),
    )

    expect(queryByTestId('confirm-modal')).toBeNull()

    fireEvent.press(getByTestId('row-menu-t1'))
    fireEvent.press(getByTestId('connected-dapp-disconnect-t1'))
    // Menu closes, confirm sheet opens.
    expect(queryByTestId('context-menu')).toBeNull()
    expect(getByText('confirm:Uniswap')).toBeTruthy()

    await act(async () => {
      fireEvent.press(getByTestId('confirm-action'))
    })
    expect(mockDisconnect).toHaveBeenCalledWith('t1', 'Uniswap')
    // Sheet closes once the disconnect succeeds.
    expect(queryByTestId('confirm-modal')).toBeNull()
  })

  it('keeps the confirm sheet open when the disconnect fails', async () => {
    mockDisconnect.mockResolvedValue(false)
    const { getByTestId, queryByTestId } = renderWithStore(
      <ConnectedDappsScreen />,
      storeWith([session('t1', 'Uniswap')]),
    )

    fireEvent.press(getByTestId('row-menu-t1'))
    fireEvent.press(getByTestId('connected-dapp-disconnect-t1'))

    await act(async () => {
      fireEvent.press(getByTestId('confirm-action'))
    })
    expect(queryByTestId('confirm-modal')).toBeTruthy()
  })

  it('opens the confirm sheet from the swipe trash action', () => {
    const { getByTestId, getByText } = renderWithStore(<ConnectedDappsScreen />, storeWith([session('t1', 'Uniswap')]))

    fireEvent.press(getByTestId('row-swipe-t1'))
    expect(getByText('confirm:Uniswap')).toBeTruthy()
  })
})
