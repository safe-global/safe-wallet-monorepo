import { faker } from '@faker-js/faker'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { spaceAddressBookTagBuilder } from '@/tests/builders/space'
import EditTagsDialog from '../EditTagsDialog'

const vendor = spaceAddressBookTagBuilder().with({ id: 1, name: 'Vendor' }).build()
const internal = spaceAddressBookTagBuilder().with({ id: 2, name: 'Internal' }).build()

const buildContact = (tagIds: number[]) => ({
  name: faker.person.fullName(),
  address: faker.finance.ethereumAddress(),
  tagIds,
})

const renderDialog = (props: Partial<Parameters<typeof EditTagsDialog>[0]> = {}) => {
  const onSave = jest.fn()
  const contact = buildContact([vendor.id])
  render(
    <EditTagsDialog
      contact={contact}
      workspaceTags={[vendor, internal]}
      onSave={onSave}
      onClose={jest.fn()}
      {...props}
    />,
  )
  return { onSave, contact }
}

describe('EditTagsDialog', () => {
  it('shows the contact and its tags in their colours', () => {
    const { contact } = renderDialog()

    expect(screen.getByText(contact.name)).toBeInTheDocument()
    expect(screen.getAllByTestId('tag-chip').map((chip) => chip.textContent)).toEqual(['Vendor'])
  })

  it('saves only after the tags change', async () => {
    const { onSave } = renderDialog()
    expect(screen.getByTestId('save-tags-btn')).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: /Tags/ }))
    await waitFor(() => expect(screen.getByRole('listbox', { name: 'Tags' })).toBeInTheDocument())
    await userEvent.click(screen.getByRole('option', { name: /Internal/ }))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByTestId('save-tags-btn'))

    expect(onSave).toHaveBeenCalledWith([vendor.id, internal.id])
  })

  it('leaves out a tag the workspace no longer has', () => {
    renderDialog({ contact: buildContact([vendor.id, 99]) })

    expect(screen.getAllByTestId('tag-chip').map((chip) => chip.textContent)).toEqual(['Vendor'])
    expect(screen.getByTestId('save-tags-btn')).toBeDisabled()
  })

  it('shows the error CGW returned', () => {
    renderDialog({ error: 'Your workspace has 8 tags. Rename or delete one to add another.' })

    expect(screen.getByRole('alert')).toHaveTextContent('Your workspace has 8 tags.')
  })
})
