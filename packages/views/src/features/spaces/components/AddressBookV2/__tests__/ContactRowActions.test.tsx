import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactRowActions from '../ContactRowActions'

const openMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Actions for Treasury' }))
  await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument())
}

const menuItems = () => screen.getAllByRole('menuitem').map((item) => item.textContent)

describe('ContactRowActions', () => {
  it('renders nothing without any action', () => {
    const { container } = render(<ContactRowActions name="Treasury" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('offers only the actions it is given', async () => {
    render(<ContactRowActions name="Treasury" onDelete={jest.fn()} />)

    await openMenu()

    expect(menuItems()).toEqual(['Delete contact'])
  })

  it('offers every action it is given and fires its callback', async () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    render(<ContactRowActions name="Treasury" onEdit={onEdit} onDelete={onDelete} />)

    await openMenu()
    expect(menuItems()).toEqual(['Edit contact', 'Delete contact'])

    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit contact' }))
    expect(onEdit).toHaveBeenCalledTimes(1)

    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete contact' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
