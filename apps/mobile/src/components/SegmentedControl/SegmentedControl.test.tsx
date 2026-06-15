import React from 'react'
import { fireEvent, render } from '@/src/tests/test-utils'
import { SegmentedControl, type SegmentedControlOption } from './SegmentedControl'

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
})
