import { useState } from 'react'
import { render, screen, fireEvent } from '@/tests/test-utils'
import { AddressSelectorList, type AddressEntry } from '../AddressSelectorList'

const ADDR_A = '0xdead00000000000000000000000000000000de01'

const setup = (addresses: AddressEntry[] = [], entryLabel?: string) => {
  const onChange = jest.fn()
  render(<AddressSelectorList addresses={addresses} onChange={onChange} entryLabel={entryLabel} />)
  return { onChange }
}

const Stateful = ({ initial = [] as AddressEntry[] }) => {
  const [addresses, setAddresses] = useState<AddressEntry[]>(initial)
  return <AddressSelectorList addresses={addresses} onChange={setAddresses} entryLabel="recipient" />
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

  describe('stateful interaction', () => {
    it('deleting one of two rows leaves exactly one row', () => {
      render(<Stateful />)
      // Add requires row 1 to be non-empty first.
      fireEvent.change(screen.getByLabelText('recipient 1'), { target: { value: ADDR_A } })
      fireEvent.click(screen.getByText('Add recipient')) // now 2 rows

      expect(screen.getByLabelText('recipient 1')).toBeInTheDocument()
      expect(screen.getByLabelText('recipient 2')).toBeInTheDocument()

      fireEvent.click(screen.getByLabelText('Remove recipient 2'))

      expect(screen.getByLabelText('recipient 1')).toBeInTheDocument()
      expect(screen.queryByLabelText('recipient 2')).not.toBeInTheDocument()
    })

    it('deleting the first row keeps the second row value', () => {
      render(<Stateful />)
      fireEvent.change(screen.getByLabelText('recipient 1'), { target: { value: 'first' } })
      fireEvent.click(screen.getByText('Add recipient')) // 2 rows (row 1 filled)
      fireEvent.change(screen.getByLabelText('recipient 2'), { target: { value: 'second' } })

      fireEvent.click(screen.getByLabelText('Remove recipient 1'))

      // The one remaining input must show 'second', not 'first'.
      expect(screen.getByLabelText('recipient 1')).toHaveValue('second')
      expect(screen.queryByLabelText('recipient 2')).not.toBeInTheDocument()
    })

    it('disables Add while any row is empty, enables once filled', () => {
      render(<Stateful />)
      const addBtn = screen.getByRole('button', { name: /add recipient/i })

      // Initial single empty row → cannot add.
      expect(addBtn).toBeDisabled()

      fireEvent.change(screen.getByLabelText('recipient 1'), { target: { value: ADDR_A } })
      expect(addBtn).toBeEnabled()

      fireEvent.click(addBtn)
      expect(screen.getByRole('button', { name: /add recipient/i })).toBeDisabled()
    })

    it('flags a duplicate address and disables Add', () => {
      render(<Stateful />)
      fireEvent.change(screen.getByLabelText('recipient 1'), { target: { value: ADDR_A } })
      fireEvent.click(screen.getByRole('button', { name: /add recipient/i })) // row 2 empty
      // Enter the same address (different case) in row 2.
      fireEvent.change(screen.getByLabelText('recipient 2'), {
        target: { value: ADDR_A.toUpperCase().replace('0X', '0x') },
      })

      expect(screen.getByRole('button', { name: /add recipient/i })).toBeDisabled()
    })
  })
})
