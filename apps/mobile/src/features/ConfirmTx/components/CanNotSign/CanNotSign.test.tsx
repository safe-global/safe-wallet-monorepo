import React from 'react'
import { render } from '@/src/tests/test-utils'
import { CanNotSign } from './CanNotSign'

describe('CanNotSign', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the correct message', () => {
    const { getByText } = render(<CanNotSign />)
    expect(getByText('Only signers of this safe can sign this transaction')).toBeTruthy()
  })
})
