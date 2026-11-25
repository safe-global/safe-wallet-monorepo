import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { validateContactName } from '@/features/spaces/components/SpaceAddressBook/utils'
import NameContactsDialog, { type ContactToName } from '../NameContactsDialog'
import { CHAINS } from '../mocks/fixtures'
import type { SuggestedContact } from '../types'

const buildSuggestion = (): SuggestedContact => ({
  address: faker.finance.ethereumAddress(),
  chains: [CHAINS.ethereum, CHAINS.base],
  suggestedName: faker.person.fullName(),
  reason: { kind: 'signer', safes: [faker.company.name()] },
})

const renderDialog = (suggestions: ContactToName[], props: Partial<Parameters<typeof NameContactsDialog>[0]> = {}) => {
  const onAdd = jest.fn()
  render(
    <NameContactsDialog
      contacts={suggestions}
      validateName={validateContactName}
      onConfirm={onAdd}
      onClose={jest.fn()}
      {...props}
    />,
  )
  return { onAdd }
}

const chainIdsOf = (suggestion: Pick<SuggestedContact, 'chains'>) => suggestion.chains.map((chain) => chain.chainId)

const nameField = (suggestion: SuggestedContact) =>
  screen.getByRole('textbox', { name: `Name for ${suggestion.suggestedName}` })

describe('NameContactsDialog', () => {
  it('keeps the suggested name when a field is left empty', async () => {
    const [a, b] = [buildSuggestion(), buildSuggestion()]
    const typed = faker.string.alpha(8)
    const { onAdd } = renderDialog([a, b])

    await userEvent.type(nameField(b), typed)
    await userEvent.click(screen.getByTestId('name-contacts-confirm-btn'))

    expect(onAdd).toHaveBeenCalledWith([
      { address: a.address, name: a.suggestedName, chainIds: chainIdsOf(a) },
      { address: b.address, name: typed, chainIds: chainIdsOf(b) },
    ])
  })

  it('saves a typed name', async () => {
    const suggestion = buildSuggestion()
    const typed = faker.string.alpha(10)
    const { onAdd } = renderDialog([suggestion])

    await userEvent.type(nameField(suggestion), `  ${typed}  `)
    await userEvent.click(screen.getByTestId('name-contacts-confirm-btn'))

    expect(onAdd).toHaveBeenCalledWith([{ address: suggestion.address, name: typed, chainIds: chainIdsOf(suggestion) }])
  })

  it('blocks a name over 50 characters with the validation message', async () => {
    const suggestion = buildSuggestion()
    const tooLong = faker.string.alpha(51)
    const message = validateContactName(tooLong)
    const { onAdd } = renderDialog([suggestion])

    await userEvent.type(nameField(suggestion), tooLong)

    expect(message).toBeDefined()
    expect(screen.getByText(message as string)).toBeInTheDocument()
    expect(screen.getByTestId('name-contacts-confirm-btn')).toBeDisabled()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('blocks an empty field whose suggested name is not valid', () => {
    const suggestion = { ...buildSuggestion(), suggestedName: faker.string.alpha(51) }
    const message = validateContactName(suggestion.suggestedName)

    renderDialog([suggestion])

    expect(message).toBeDefined()
    expect(screen.getByText(message as string)).toBeInTheDocument()
    expect(screen.getByTestId('name-contacts-confirm-btn')).toBeDisabled()
  })

  it('submits when Enter is pressed in a name field', async () => {
    const suggestion = buildSuggestion()
    const typed = faker.string.alpha(8)
    const { onAdd } = renderDialog([suggestion])

    await userEvent.type(nameField(suggestion), `${typed}{Enter}`)

    expect(onAdd).toHaveBeenCalledWith([{ address: suggestion.address, name: typed, chainIds: chainIdsOf(suggestion) }])
  })

  it.each([
    { count: 1, label: 'Add 1 contact' },
    { count: 2, label: 'Add 2 contacts' },
  ])('labels the button "$label" for $count suggestions', ({ count, label }) => {
    renderDialog(Array.from({ length: count }, buildSuggestion))

    expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
  })

  it('shows the title, description and button label it is given', () => {
    const [title, description, confirmLabel] = [faker.lorem.words(3), faker.lorem.sentence(), faker.lorem.words(2)]
    renderDialog([buildSuggestion()], { title, description, confirmLabel })

    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByText(description)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: confirmLabel })).toBeInTheDocument()
  })

  it('names a contact that has no reason to show', async () => {
    const { address, chains, suggestedName } = buildSuggestion()
    const contact = { address, chains, suggestedName }
    const { onAdd } = renderDialog([contact])

    expect(screen.queryByText(/^Signer of/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByTestId('name-contacts-confirm-btn'))

    expect(onAdd).toHaveBeenCalledWith([{ address, name: suggestedName, chainIds: chainIdsOf(contact) }])
  })

  it('shows the save error', () => {
    const error = faker.lorem.sentence()
    renderDialog([buildSuggestion()], { error })

    expect(screen.getByRole('alert')).toHaveTextContent(error)
  })
})
