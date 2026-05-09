import React from 'react'
import { render } from '@/src/tests/test-utils'
import { PositionsEmpty } from './PositionsEmpty'

describe('PositionsEmpty', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<PositionsEmpty />)

    expect(toJSON()).toMatchSnapshot()
  })
})
