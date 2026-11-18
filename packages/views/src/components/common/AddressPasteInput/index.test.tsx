import { fireEvent, render, screen } from '@testing-library/react'
import AddressPasteInput from './index'

const ADDRESS = '0x1234567890123456789012345678901234567890'

describe('AddressPasteInput', () => {
  it('strips the chain prefix from a pasted address', () => {
    const onChange = jest.fn()
    const onPaste = jest.fn()
    render(<AddressPasteInput placeholder="Address" onChange={onChange} onPaste={onPaste} />)

    const input = screen.getByPlaceholderText('Address')
    fireEvent.paste(input, { clipboardData: { getData: () => `eth:${ADDRESS}` } })

    expect(input).toHaveValue(ADDRESS)
    expect(onChange).toHaveBeenCalled()
    expect(onPaste).toHaveBeenCalledTimes(1)
  })

  it('leaves a pasted value without a prefix unchanged', () => {
    render(<AddressPasteInput placeholder="Address" />)

    const input = screen.getByPlaceholderText('Address')
    fireEvent.paste(input, { clipboardData: { getData: () => ADDRESS } })

    expect(input).toHaveValue(ADDRESS)
  })
})
