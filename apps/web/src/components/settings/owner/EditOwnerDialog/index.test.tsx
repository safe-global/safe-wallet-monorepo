import { faker } from '@faker-js/faker'
import { getStoreInstance } from '@/store'
import { fakerChecksummedAddress, renderWithUserEvent, screen } from '@/tests/test-utils'
import { EditOwnerDialog } from './index'

const CHAIN_ID = '1'
const CURRENT_NAME = 'Alice'
const MAX_NAME_LENGTH = 50

const openEditOwnerDialog = async (address = fakerChecksummedAddress()) => {
  const rendered = renderWithUserEvent(<EditOwnerDialog chainId={CHAIN_ID} address={address} name={CURRENT_NAME} />)
  await rendered.user.click(screen.getByRole('button'))
  return rendered
}

const nameInput = () => screen.getByRole('textbox')
const saveButton = () => screen.getByRole('button', { name: 'Save' })

describe('EditOwnerDialog', () => {
  it('disables Save while the name is unchanged', async () => {
    await openEditOwnerDialog()

    expect(nameInput()).toHaveValue(CURRENT_NAME)
    expect(saveButton()).toBeDisabled()
  })

  it('enables Save for a new valid name', async () => {
    const { user } = await openEditOwnerDialog()

    await user.clear(nameInput())
    await user.type(nameInput(), 'Bob')

    expect(saveButton()).toBeEnabled()
  })

  it('disables Save when the name is cleared', async () => {
    const { user } = await openEditOwnerDialog()

    await user.clear(nameInput())

    expect(saveButton()).toBeDisabled()
  })

  it('disables Save when the name is only whitespace', async () => {
    const { user } = await openEditOwnerDialog()

    await user.clear(nameInput())
    await user.type(nameInput(), '   ')

    expect(saveButton()).toBeDisabled()
  })

  it('disables Save when the name is longer than the maximum length', async () => {
    const { user } = await openEditOwnerDialog()

    await user.clear(nameInput())
    await user.type(nameInput(), faker.string.alpha(MAX_NAME_LENGTH + 1))

    expect(saveButton()).toBeDisabled()
  })

  it('saves the new name to the address book of the chain', async () => {
    const address = fakerChecksummedAddress()
    const { user } = await openEditOwnerDialog(address)

    await user.clear(nameInput())
    await user.type(nameInput(), 'Bob')
    await user.click(saveButton())

    expect(getStoreInstance().getState().addressBook[CHAIN_ID][address]).toBe('Bob')
  })

  it('closes the dialog after saving', async () => {
    const { user } = await openEditOwnerDialog()

    await user.clear(nameInput())
    await user.type(nameInput(), 'Bob')
    await user.click(saveButton())

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  })
})
