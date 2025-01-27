import React from 'react'
import { Onboarding } from './Onboarding.container'
import { fireEvent, render } from '@/src/tests/test-utils'

const mockNavigate = jest.fn()

jest.mock('@notifee/react-native', () => ({
  AndroidImportance: {
    NONE: 0,
    MIN: 1,
    LOW: 2,
    DEFAULT: 3,
    HIGH: 4,
  },
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: mockNavigate,
  }),
}))

describe('Onboarding Component', () => {
  it('renders correctly', () => {
    const { getAllByText } = render(<Onboarding />)
    expect(getAllByText('Get started')).toHaveLength(1)
  })

  it('navigates on button press', () => {
    const { getByText } = render(<Onboarding />)
    const button = getByText('Get started')

    fireEvent.press(button)
    expect(mockNavigate).toHaveBeenCalledWith('/(tabs)')
  })
})
