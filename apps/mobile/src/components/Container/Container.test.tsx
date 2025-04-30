import React from 'react'
import { render } from '@/src/tests/test-utils'
import { Container } from './index'
import { Text } from 'react-native'

describe('Container', () => {
  it('renders correctly with children', () => {
    const { getByText } = render(
      <Container>
        <Text>Test Child</Text>
      </Container>,
    )
    expect(getByText('Test Child')).toBeTruthy()
  })

  it('applies the correct styles', () => {
    const { getByTestId } = render(
      <Container testID="container">
        <Text>Test Child</Text>
      </Container>,
    )
    const container = getByTestId('container')
    expect(container.props.style).toMatchSnapshot()
  })
})
