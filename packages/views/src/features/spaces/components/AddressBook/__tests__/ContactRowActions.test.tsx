import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactRowActions from '../ContactRowActions'
import { ADMIN_PERMISSIONS, MEMBER_PERMISSIONS } from '../types'

const openMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Actions for Treasury' }))
  await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument())
}

describe('ContactRowActions', () => {
  it('renders nothing without any permission', () => {
    const { container } = render(
      <ContactRowActions name="Treasury" permissions={{ canEdit: false, canEditTags: false, canDelete: false }} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('offers a member only Edit tags', async () => {
    render(<ContactRowActions name="Treasury" permissions={MEMBER_PERMISSIONS} />)

    await openMenu()

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Edit tags'])
  })

  it('offers an admin every action and fires its callback', async () => {
    const onEdit = jest.fn()
    const onEditTags = jest.fn()
    const onDelete = jest.fn()
    render(
      <ContactRowActions
        name="Treasury"
        permissions={ADMIN_PERMISSIONS}
        onEdit={onEdit}
        onEditTags={onEditTags}
        onDelete={onDelete}
      />,
    )

    await openMenu()
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Edit contact',
      'Edit tags',
      'Delete contact',
    ])

    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit contact' }))
    expect(onEdit).toHaveBeenCalledTimes(1)

    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit tags' }))
    expect(onEditTags).toHaveBeenCalledTimes(1)

    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete contact' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
