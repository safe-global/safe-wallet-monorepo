import React from 'react'
import { render } from '@/src/tests/test-utils'
import { AlreadySigned } from './AlreadySigned'

describe('AlreadySigned', () => {
  it('renders correctly with all required elements', () => {
    const { getByText } = render(<AlreadySigned />)

    expect(getByText('Can be executed once the threshold is reached.')).toBeTruthy()
  })

  it('matches snapshot', () => {
    const { toJSON } = render(<AlreadySigned />)
    expect(toJSON()).toMatchSnapshot()
  })
})
