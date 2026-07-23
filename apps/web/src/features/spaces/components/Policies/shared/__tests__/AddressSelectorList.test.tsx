import { render, screen, fireEvent } from '@/tests/test-utils'
import { AddressSelectorList, type AddressEntry } from '../AddressSelectorList'

const setup = (addresses: AddressEntry[] = [], entryLabel?: string) => {
  const onChange = jest.fn()
  render(<AddressSelectorList addresses={addresses} onChange={onChange} entryLabel={entryLabel} />)
  return { onChange }
}

describe('AddressSelectorList', () => {
  it('renders one empty row when given no addresses', () => {
    setup([])
    expect(screen.getByLabelText('address 1')).toBeInTheDocument()
  })

  it('uses the provided entryLabel for aria-labels and the add button', () => {
    setup([], 'recipient')
    expect(screen.getByLabelText('recipient 1')).toBeInTheDocument()
    expect(screen.getByText('Add recipient')).toBeInTheDocument()
  })

  it('adds a row', () => {
    const { onChange } = setup([{ address: '0x1111111111111111111111111111111111111111' }])
    fireEvent.click(screen.getByText('Add address'))
    expect(onChange).toHaveBeenCalledWith([{ address: '0x1111111111111111111111111111111111111111' }, { address: '' }])
  })

  it('updates an address', () => {
    const { onChange } = setup([{ address: '' }])
    fireEvent.change(screen.getByLabelText('address 1'), {
      target: { value: '0x2222222222222222222222222222222222222222' },
    })
    expect(onChange).toHaveBeenCalledWith([{ address: '0x2222222222222222222222222222222222222222' }])
  })

  it('removes a row when more than one exists', () => {
    const { onChange } = setup([
      { address: '0x1111111111111111111111111111111111111111' },
      { address: '0x2222222222222222222222222222222222222222' },
    ])
    fireEvent.click(screen.getByLabelText('Remove address 2'))
    expect(onChange).toHaveBeenCalledWith([{ address: '0x1111111111111111111111111111111111111111' }])
  })

  it('does not show a remove button when only one row exists', () => {
    setup([{ address: '0x1111111111111111111111111111111111111111' }])
    expect(screen.queryByLabelText('Remove address 1')).not.toBeInTheDocument()
  })
})
