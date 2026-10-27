import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { validateContactName } from '@/features/spaces/components/SpaceAddressBook/utils'
import AddSuggestionsDialog from '../AddSuggestionsDialog'
import { CHAINS } from '../mocks/fixtures'
import type { SuggestedContact } from '../types'

const buildSuggestion = (): SuggestedContact => ({
  address: faker.finance.ethereumAddress(),
  chains: [CHAINS.ethereum, CHAINS.base],
  suggestedName: faker.person.fullName(),
  reason: { kind: 'signer', safes: [faker.company.name()] },
})

const renderDialog = (
  suggestions: SuggestedContact[],
  props: Partial<Parameters<typeof AddSuggestionsDialog>[0]> = {},
) => {
  const onAdd = jest.fn()
  render(
    <AddSuggestionsDialog
      suggestions={suggestions}
      validateName={validateContactName}
      onAdd={onAdd}
      onClose={jest.fn()}
      {...props}
    />,
  )
  return { onAdd }
}

const nameField = (suggestion: SuggestedContact) =>
  screen.getByRole('textbox', { name: `Name for ${suggestion.suggestedName}` })

describe('AddSuggestionsDialog', () => {
  it('keeps the suggested name when a field is left empty', async () => {
    const [a, b] = [buildSuggestion(), buildSuggestion()]
    const typed = faker.string.alpha(8)
    const { onAdd } = renderDialog([a, b])

    await userEvent.type(nameField(b), typed)
    await userEvent.click(screen.getByTestId('add-suggestions-btn'))

    expect(onAdd).toHaveBeenCalledWith([
      { address: a.address, name: a.suggestedName, chainIds: ['1', '8453'] },
      { address: b.address, name: typed, chainIds: ['1', '8453'] },
    ])
  })

  it('saves a typed name', async () => {
    const suggestion = buildSuggestion()
    const typed = faker.string.alpha(10)
    const { onAdd } = renderDialog([suggestion])

    await userEvent.type(nameField(suggestion), `  ${typed}  `)
    await userEvent.click(screen.getByTestId('add-suggestions-btn'))

    expect(onAdd).toHaveBeenCalledWith([{ address: suggestion.address, name: typed, chainIds: ['1', '8453'] }])
  })

  it('blocks a name over 50 characters with the validation message', async () => {
    const suggestion = buildSuggestion()
    const tooLong = faker.string.alpha(51)
    const message = validateContactName(tooLong)
    const { onAdd } = renderDialog([suggestion])

    await userEvent.type(nameField(suggestion), tooLong)

    expect(message).toBeDefined()
    expect(screen.getByText(message as string)).toBeInTheDocument()
    expect(screen.getByTestId('add-suggestions-btn')).toBeDisabled()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('submits when Enter is pressed in a name field', async () => {
    const suggestion = buildSuggestion()
    const typed = faker.string.alpha(8)
    const { onAdd } = renderDialog([suggestion])

    await userEvent.type(nameField(suggestion), `${typed}{Enter}`)

    expect(onAdd).toHaveBeenCalledWith([{ address: suggestion.address, name: typed, chainIds: ['1', '8453'] }])
  })

  it('labels the button with the contact count', () => {
    const { unmount } = render(
      <AddSuggestionsDialog
        suggestions={[buildSuggestion(), buildSuggestion()]}
        validateName={validateContactName}
        onAdd={jest.fn()}
        onClose={jest.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Add 2 contacts' })).toBeInTheDocument()
    unmount()

    renderDialog([buildSuggestion()])
    expect(screen.getByRole('button', { name: 'Add 1 contact' })).toBeInTheDocument()
  })

  it('shows the save error', () => {
    const error = faker.lorem.sentence()
    renderDialog([buildSuggestion()], { error })

    expect(screen.getByRole('alert')).toHaveTextContent(error)
  })
})
