import React from 'react'
import { render } from '@/src/tests/test-utils'
import { CanNotSign } from './CanNotSign'
import { SelectSigner } from '@/src/components/SelectSigner'

// Mock the SelectSigner component
jest.mock('@/src/components/SelectSigner', () => ({
  SelectSigner: jest.fn(() => null),
}))

describe('CanNotSign', () => {
  const defaultProps = {
    address: '0x123' as const,
    txId: 'tx123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the correct message', () => {
    const { getByText } = render(<CanNotSign {...defaultProps} />)
    expect(getByText('Only signers of this safe can sign this transaction')).toBeTruthy()
  })

  it('renders SelectSigner when address is provided', () => {
    render(<CanNotSign {...defaultProps} />)

    expect(SelectSigner).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x123',
        txId: 'tx123',
      }),
      undefined,
    )
  })

  it('does not render SelectSigner when address is undefined', () => {
    render(<CanNotSign {...defaultProps} address={undefined} />)

    expect(SelectSigner).not.toHaveBeenCalled()
  })

  it('matches snapshot with address', () => {
    const { toJSON } = render(<CanNotSign {...defaultProps} />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('matches snapshot without address', () => {
    const { toJSON } = render(<CanNotSign {...defaultProps} address={undefined} />)
    expect(toJSON()).toMatchSnapshot()
  })
})
