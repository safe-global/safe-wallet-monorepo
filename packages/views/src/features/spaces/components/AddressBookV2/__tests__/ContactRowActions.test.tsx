import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactRowActions from '../ContactRowActions'
import { FULL_PERMISSIONS, NO_PERMISSIONS } from '../types'

const openMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Actions for Treasury' }))
  await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument())
}

const menuItems = () => screen.getAllByRole('menuitem').map((item) => item.textContent)

describe('ContactRowActions', () => {
  it('renders nothing without any permission', () => {
    const { container } = render(<ContactRowActions name="Treasury" permissions={NO_PERMISSIONS} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('offers only the actions the member may take', async () => {
    render(<ContactRowActions name="Treasury" permissions={{ canEdit: false, canDelete: true }} />)

    await openMenu()

    expect(menuItems()).toEqual(['Delete contact'])
  })

  it('offers an admin every action and fires its callback', async () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    render(<ContactRowActions name="Treasury" permissions={FULL_PERMISSIONS} onEdit={onEdit} onDelete={onDelete} />)

    await openMenu()
    expect(menuItems()).toEqual(['Edit contact', 'Delete contact'])

    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit contact' }))
    expect(onEdit).toHaveBeenCalledTimes(1)

    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete contact' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
