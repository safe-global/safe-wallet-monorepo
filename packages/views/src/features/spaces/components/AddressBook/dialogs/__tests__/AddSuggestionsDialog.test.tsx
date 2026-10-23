import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddSuggestionsDialog from '../AddSuggestionsDialog'
import { NAME_MAX_LENGTH } from '../ContactFormDialog'
import type { SuggestedContact } from '../../types'

const buildSuggestion = (fields: Partial<SuggestedContact> = {}): SuggestedContact => ({
  address: faker.finance.ethereumAddress(),
  chains: [{ chainId: '1', name: 'Ethereum' }],
  suggestedName: faker.person.fullName(),
  reason: { kind: 'signer', safes: ['Treasury'] },
  ...fields,
})

const renderDialog = (suggestions: SuggestedContact[], onAdd = jest.fn()) =>
  render(<AddSuggestionsDialog suggestions={suggestions} onAdd={onAdd} onClose={jest.fn()} />)

describe('AddSuggestionsDialog', () => {
  it('saves the suggested name when the name is left empty', async () => {
    const onAdd = jest.fn()
    const suggestion = buildSuggestion()
    renderDialog([suggestion], onAdd)

    await userEvent.click(screen.getByTestId('add-suggestions-btn'))

    expect(onAdd).toHaveBeenCalledWith([expect.objectContaining({ name: suggestion.suggestedName })])
  })

  it('trims the typed name', async () => {
    const onAdd = jest.fn()
    const suggestion = buildSuggestion()
    renderDialog([suggestion], onAdd)

    await userEvent.type(screen.getByLabelText(`Name for ${suggestion.address}`), '  Alice  ')
    await userEvent.click(screen.getByTestId('add-suggestions-btn'))

    expect(onAdd).toHaveBeenCalledWith([expect.objectContaining({ name: 'Alice' })])
  })

  it('counts the suggestions in the button', () => {
    const { unmount } = renderDialog([buildSuggestion()])
    expect(screen.getByTestId('add-suggestions-btn')).toHaveTextContent('Add 1 contact')
    unmount()

    renderDialog([buildSuggestion(), buildSuggestion(), buildSuggestion()])
    expect(screen.getByTestId('add-suggestions-btn')).toHaveTextContent('Add 3 contacts')
  })

  it('disables the button while a name is too long', async () => {
    const suggestion = buildSuggestion()
    renderDialog([suggestion, buildSuggestion()])
    const input = screen.getByLabelText(`Name for ${suggestion.address}`)

    await userEvent.type(input, 'a'.repeat(NAME_MAX_LENGTH + 1))
    expect(screen.getByTestId('add-suggestions-btn')).toBeDisabled()
    expect(input).toHaveAttribute('aria-invalid', 'true')

    await userEvent.type(input, '{Backspace}')
    expect(screen.getByTestId('add-suggestions-btn')).toBeEnabled()
  })

  it('passes each address with its name and chain IDs', async () => {
    const onAdd = jest.fn()
    const first = buildSuggestion({
      chains: [
        { chainId: '1', name: 'Ethereum' },
        { chainId: '42161', name: 'Arbitrum' },
      ],
    })
    const second = buildSuggestion({
      chains: [{ chainId: '8453', name: 'Base' }],
      reason: { kind: 'frequent', transactions: 4 },
    })
    renderDialog([first, second], onAdd)

    await userEvent.type(screen.getByLabelText(`Name for ${second.address}`), 'Vendor')
    await userEvent.click(screen.getByTestId('add-suggestions-btn'))

    expect(onAdd).toHaveBeenCalledWith([
      { address: first.address, name: first.suggestedName, chainIds: ['1', '42161'] },
      { address: second.address, name: 'Vendor', chainIds: ['8453'] },
    ])
  })
})
