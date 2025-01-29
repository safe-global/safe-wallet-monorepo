import React from 'react'
import { NotificationsContainer } from './Notifications.container'
import { act, fireEvent, render, waitFor } from '@/src/tests/test-utils'
import { SwitchChangeEvent } from 'react-native'

const mockDispatch = jest.fn()

jest.mock('@/src/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: unknown) => unknown) => {
    if (selector.name === 'selectAppNotificationStatus') {
      return true
    }
    return false
  },
}))

describe('Notifications Component', () => {
  it('renders correctly', () => {
    const { getAllByText } = render(<NotificationsContainer />)
    expect(getAllByText('Allow notifications')).toHaveLength(1)
  })

  it('triggers notification action on switch change', async () => {
    const { getByTestId } = render(<NotificationsContainer />)
    const switcher = getByTestId('toggle-app-notifications')
    expect(switcher).toBeTruthy()

    act(() => {
      fireEvent(switcher, 'onChange', { nativeEvent: { value: true } } as SwitchChangeEvent)
    })

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled()
    })
  })
})
