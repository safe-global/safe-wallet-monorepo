import React from 'react'
import type { SessionTypes } from '@walletconnect/types'
import { renderWithStore, createTestStore, fireEvent } from '@/src/tests/test-utils'
import { ConnectedDappsEntry } from '../ConnectedDappsEntry'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  router: { push: (path: string) => mockPush(path) },
}))

const mockUseHasFeature = jest.fn()
jest.mock('@/src/hooks/useHasFeature', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

const session = (topic: string): SessionTypes.Struct =>
  ({ topic, peer: { metadata: { name: topic } } }) as unknown as SessionTypes.Struct

const storeWith = (topics: string[]) =>
  createTestStore({
    walletKit: {
      sessions: Object.fromEntries(topics.map((t) => [t, session(t)])),
      verifyByTopic: {},
      pending: [],
      outstandingRequests: {},
    },
  } as never)

describe('ConnectedDappsEntry', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders nothing when the feature flag is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    const { queryByTestId } = renderWithStore(<ConnectedDappsEntry />, storeWith(['a']))
    expect(queryByTestId('settings-connected-apps-entry')).toBeNull()
  })

  it('renders nothing when there are no connected dApps', () => {
    mockUseHasFeature.mockReturnValue(true)
    const { queryByTestId } = renderWithStore(<ConnectedDappsEntry />, storeWith([]))
    expect(queryByTestId('settings-connected-apps-entry')).toBeNull()
  })

  it('shows the session count and navigates when pressed', () => {
    mockUseHasFeature.mockReturnValue(true)
    const { getByTestId } = renderWithStore(<ConnectedDappsEntry />, storeWith(['a', 'b']))

    expect(getByTestId('connected-apps-count')).toHaveTextContent('2')

    fireEvent.press(getByTestId('settings-connected-apps-entry'))
    expect(mockPush).toHaveBeenCalledWith('/connected-apps')
  })
})
