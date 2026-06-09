import React from 'react'
import type { SessionTypes } from '@walletconnect/types'
import { renderWithStore, createTestStore, fireEvent, act } from '@/src/tests/test-utils'
import { ConnectedDappsScreen } from '../ConnectedDappsScreen'

const mockDisconnect = jest.fn()
let mockBusyTopic: string | null = null
jest.mock('../../hooks/useDisconnectSession', () => ({
  useDisconnectSession: () => ({ disconnect: mockDisconnect, busyTopic: mockBusyTopic }),
}))

// Stub the confirm sheet: render the pending dApp name and an inline confirm trigger so the
// screen's selection + confirm wiring is observable without the bottom-sheet internals.
jest.mock('../DisconnectConfirmModal', () => {
  const { Text, View } = jest.requireActual('react-native')
  return {
    DisconnectConfirmModal: ({ dappName, onConfirm }: { dappName: string | null; onConfirm: () => void }) =>
      dappName ? (
        <View testID="confirm-modal">
          <Text>{`confirm:${dappName}`}</Text>
          <Text testID="confirm-action" onPress={onConfirm}>
            confirm
          </Text>
        </View>
      ) : null,
  }
})

const session = (topic: string, name: string, url = `https://${name}.test`): SessionTypes.Struct =>
  ({ topic, peer: { metadata: { name, url, icons: [] } } }) as unknown as SessionTypes.Struct

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
    mockDisconnect.mockReset().mockResolvedValue(undefined)
    mockBusyTopic = null
  })

  it('shows the empty state when there are no sessions', () => {
    const { getByText } = renderWithStore(<ConnectedDappsScreen />, storeWith([]))
    expect(getByText('No connected apps.')).toBeTruthy()
  })

  it('renders a row per connected dApp', () => {
    const { getByText, getAllByTestId } = renderWithStore(
      <ConnectedDappsScreen />,
      storeWith([session('t1', 'Uniswap'), session('t2', 'Aave')]),
    )
    expect(getAllByTestId('connected-dapp-row')).toHaveLength(2)
    expect(getByText('Uniswap')).toBeTruthy()
    expect(getByText('https://Aave.test')).toBeTruthy()
  })

  it('opens the confirm sheet and disconnects the selected dApp', async () => {
    const { getByTestId, getByText, queryByTestId } = renderWithStore(
      <ConnectedDappsScreen />,
      storeWith([session('t1', 'Uniswap')]),
    )

    expect(queryByTestId('confirm-modal')).toBeNull()

    fireEvent.press(getByTestId('connected-dapp-menu-t1'))
    expect(getByText('confirm:Uniswap')).toBeTruthy()

    await act(async () => {
      fireEvent.press(getByTestId('confirm-action'))
    })
    expect(mockDisconnect).toHaveBeenCalledWith('t1', 'Uniswap')
  })
})
