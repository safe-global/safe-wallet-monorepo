import React from 'react'
import { render } from '@/src/tests/test-utils'
import { OnboardingCarousel } from './OnboardingCarousel'
import { Text } from 'tamagui'

describe('OnboardingCarousel', () => {
  const items = [
    { name: 'Item1', title: <Text>Item1 Title</Text> },
    { name: 'Item2', title: <Text>Item2 Title</Text> },
    { name: 'Item3', title: <Text>Item3 Title</Text> },
  ]

  // react-native-collapsible-tab-view does not returns any information about the tabs children
  // that is why we only test the children component here =/
  it('renders without crashing', () => {
    const { getByTestId } = render(<OnboardingCarousel items={items} />)

    expect(getByTestId('carrousel')).toBeTruthy()
  })
})
