import React from 'react'
import { NotificationsContainer } from './Notifications.container'
import { fireEvent, render } from '@/src/tests/test-utils'

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

  it('triggers notification action on switch change', () => {
    const { getByTestId } = render(<NotificationsContainer />)
    const button = getByTestId('toggle-app-notifications')

    fireEvent.press(button)
    expect(mockDispatch).toHaveBeenCalledTimes(1)
  })
})
