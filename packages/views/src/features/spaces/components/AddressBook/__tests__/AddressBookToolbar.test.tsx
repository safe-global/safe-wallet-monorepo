import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddressBookToolbar, { type AddressBookToolbarProps } from '../AddressBookToolbar'
import { ADMIN_PERMISSIONS, EMPTY_FILTERS, MEMBER_PERMISSIONS } from '../types'

const renderToolbar = (props: Partial<AddressBookToolbarProps> = {}) =>
  render(
    <AddressBookToolbar
      permissions={ADMIN_PERMISSIONS}
      filters={EMPTY_FILTERS}
      onFiltersChange={jest.fn()}
      categoryCounts={new Map()}
      tags={[]}
      {...props}
    />,
  )

describe('AddressBookToolbar', () => {
  it('shows Import signers with the count when signers are missing', () => {
    renderToolbar({ missingSignerCount: 3 })

    expect(screen.getByTestId('import-all-signers')).toHaveTextContent('Import signers3')
  })

  it('hides Import signers when no signer is missing', () => {
    renderToolbar({ missingSignerCount: 0 })

    expect(screen.queryByTestId('import-all-signers')).not.toBeInTheDocument()
  })

  it('hides Add contact, Import and Import signers from members but keeps Export', () => {
    renderToolbar({ permissions: MEMBER_PERMISSIONS, missingSignerCount: 3 })

    expect(screen.queryByTestId('add-contact')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Import' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('import-all-signers')).not.toBeInTheDocument()
    expect(screen.getByTestId('export-address-book')).toBeInTheDocument()
  })

  it('shows Add contact and Import to admins and fires their callbacks', async () => {
    const onAddContact = jest.fn()
    const onImport = jest.fn()
    renderToolbar({ onAddContact, onImport })

    await userEvent.click(screen.getByTestId('add-contact'))
    await userEvent.click(screen.getByRole('button', { name: 'Import' }))

    expect(onAddContact).toHaveBeenCalledTimes(1)
    expect(onImport).toHaveBeenCalledTimes(1)
  })

  it('hides Clear while nothing is filtered', () => {
    renderToolbar()

    expect(screen.queryByTestId('clear-filters')).not.toBeInTheDocument()
  })

  it('resets the filters on Clear', async () => {
    const onFiltersChange = jest.fn()
    renderToolbar({ filters: { query: 'atlas', categories: ['eoa'], tags: ['Vendor'] }, onFiltersChange })

    await userEvent.click(screen.getByTestId('clear-filters'))

    expect(onFiltersChange).toHaveBeenCalledWith(EMPTY_FILTERS)
  })
})
