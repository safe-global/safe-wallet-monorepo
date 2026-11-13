import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SuggestedContacts from '../SuggestedContacts'
import type { SuggestedContact } from '../types'

const buildSuggestion = (fields: Partial<SuggestedContact> = {}): SuggestedContact => ({
  address: faker.finance.ethereumAddress(),
  chains: [{ chainId: '1', name: 'Ethereum' }],
  suggestedName: faker.person.fullName(),
  reason: { kind: 'signer', safes: ['Treasury'] },
  ...fields,
})

describe('SuggestedContacts', () => {
  it('shows the empty state when there are no suggestions', () => {
    render(<SuggestedContacts suggestions={[]} canAdd onAdd={jest.fn()} />)

    expect(screen.getByTestId('suggestions-empty')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('says why each address is suggested', () => {
    render(
      <SuggestedContacts
        suggestions={[
          buildSuggestion({ reason: { kind: 'signer', safes: ['Treasury', 'Payroll'] } }),
          buildSuggestion({ reason: { kind: 'frequent', transactions: 12 } }),
        ]}
        canAdd={false}
        onAdd={jest.fn()}
      />,
    )

    const reasons = screen.getAllByTestId('suggestion-reason').map((reason) => reason.textContent)
    expect(reasons).toEqual(['Signer of Treasury, Payroll', '12 transactions with your Safes'])
  })

  it('adds a single suggestion from its row for admins', async () => {
    const onAdd = jest.fn()
    const suggestions = [buildSuggestion(), buildSuggestion()]
    render(<SuggestedContacts suggestions={suggestions} canAdd onAdd={onAdd} />)

    const addButtons = screen.getAllByTestId('add-suggestion')
    expect(addButtons).toHaveLength(2)

    await userEvent.click(addButtons[1])

    expect(onAdd).toHaveBeenCalledWith([suggestions[1]])
  })

  it('adds every selected suggestion from the bulk bar', async () => {
    const onAdd = jest.fn()
    const suggestions = [buildSuggestion(), buildSuggestion(), buildSuggestion()]
    render(<SuggestedContacts suggestions={suggestions} canAdd onAdd={onAdd} />)

    expect(screen.queryByTestId('suggestions-bulk-bar')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: `Select ${suggestions[0].suggestedName}` }))
    await userEvent.click(screen.getByRole('checkbox', { name: `Select ${suggestions[2].suggestedName}` }))

    expect(screen.getByTestId('suggestions-bulk-bar')).toHaveTextContent('2 selected')

    await userEvent.click(screen.getByRole('button', { name: 'Add 2 to workspace' }))

    expect(onAdd).toHaveBeenCalledWith([suggestions[0], suggestions[2]])
  })

  it('clears the selection and hides the bulk bar', async () => {
    const suggestions = [buildSuggestion()]
    render(<SuggestedContacts suggestions={suggestions} canAdd onAdd={jest.fn()} />)

    await userEvent.click(screen.getByRole('checkbox', { name: `Select ${suggestions[0].suggestedName}` }))
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(screen.queryByTestId('suggestions-bulk-bar')).not.toBeInTheDocument()
  })

  it('shows members neither Add buttons nor checkboxes', () => {
    render(<SuggestedContacts suggestions={[buildSuggestion(), buildSuggestion()]} canAdd={false} onAdd={jest.fn()} />)

    expect(screen.getAllByTestId('suggestion-reason')).toHaveLength(2)
    expect(screen.queryByTestId('add-suggestion')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})
