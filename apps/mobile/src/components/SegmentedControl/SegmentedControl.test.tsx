import React from 'react'
import { StyleSheet } from 'react-native'
import { fireEvent, render } from '@/src/tests/test-utils'
import { SegmentedControl, type SegmentedControlOption } from './SegmentedControl'

// Build on the official reanimated mock (tamagui's animation driver needs its Animated exports)
// and override just the hooks so we can assert the computed thumb style synchronously: the shared
// value is plain, withSpring resolves to its target, and useAnimatedStyle returns its result.
jest.mock('react-native-reanimated', () => {
  const Reanimated = jest.requireActual('react-native-reanimated/mock')
  return {
    ...Reanimated,
    useSharedValue: (initial: number) => ({ value: initial }),
    withSpring: (toValue: number) => toValue,
    useAnimatedStyle: (fn: () => unknown) => fn(),
  }
})

type Tab = 'scan' | 'mycode'

const options: SegmentedControlOption<Tab>[] = [
  { label: 'Scan QR', value: 'scan' },
  { label: 'My code', value: 'mycode' },
]

describe('SegmentedControl', () => {
  it('renders every option label', () => {
    const { getByText } = render(<SegmentedControl options={options} value="scan" onChange={jest.fn()} />)
    expect(getByText('Scan QR')).toBeTruthy()
    expect(getByText('My code')).toBeTruthy()
  })

  it('fires onChange with the pressed option value', () => {
    const onChange = jest.fn()
    const { getByText } = render(<SegmentedControl options={options} value="scan" onChange={onChange} />)

    fireEvent.press(getByText('My code'))
    expect(onChange).toHaveBeenCalledWith('mycode')
  })

  it('marks the selected option via accessibility state', () => {
    const { getByLabelText } = render(<SegmentedControl options={options} value="mycode" onChange={jest.fn()} />)

    expect(getByLabelText('My code').props.accessibilityState).toMatchObject({ selected: true })
    expect(getByLabelText('Scan QR').props.accessibilityState).toMatchObject({ selected: false })
  })

  it('positions the thumb over the selected segment', () => {
    const first = render(<SegmentedControl options={options} value="scan" onChange={jest.fn()} testID="seg" />)
    const firstThumb = StyleSheet.flatten(first.getByTestId('seg-thumb').props.style)
    expect(firstThumb).toMatchObject({ left: '0%', width: '50%' })

    const second = render(<SegmentedControl options={options} value="mycode" onChange={jest.fn()} testID="seg" />)
    const secondThumb = StyleSheet.flatten(second.getByTestId('seg-thumb').props.style)
    expect(secondThumb).toMatchObject({ left: '50%', width: '50%' })
  })
})
