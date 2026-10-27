import { faker } from '@faker-js/faker'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SuggestedContacts from '../SuggestedContacts'
import { CHAINS } from '../mocks/fixtures'
import type { SuggestedContact } from '../types'

let mockIsMobile = false
jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: () => mockIsMobile }))

const buildSuggestion = (safes: string[] = [faker.company.name()]): SuggestedContact => ({
  address: faker.finance.ethereumAddress(),
  chains: [CHAINS.ethereum],
  suggestedName: faker.person.fullName(),
  reason: { kind: 'signer', safes },
})

describe('SuggestedContacts', () => {
  beforeEach(() => {
    mockIsMobile = false
  })

  it('shows the empty state when there are no suggestions', () => {
    render(<SuggestedContacts suggestions={[]} canAdd />)

    expect(screen.getByText('No suggestions right now')).toBeInTheDocument()
  })

  it('adds one row with the row button', async () => {
    const [first, second] = [buildSuggestion(), buildSuggestion()]
    const onAdd = jest.fn()
    render(<SuggestedContacts suggestions={[first, second]} canAdd onAdd={onAdd} />)

    const [row] = screen.getAllByTestId('table-row')
    await userEvent.click(within(row).getByRole('button', { name: 'Add to workspace' }))

    expect(onAdd).toHaveBeenCalledWith([first], 'row')
  })

  it('shows an icon-only add button in the compact table', async () => {
    mockIsMobile = true
    const suggestion = buildSuggestion()
    const onAdd = jest.fn()
    render(<SuggestedContacts suggestions={[suggestion]} canAdd onAdd={onAdd} />)

    const button = screen.getByRole('button', { name: 'Add to workspace' })
    expect(button).toHaveTextContent('')
    await userEvent.click(button)

    expect(onAdd).toHaveBeenCalledWith([suggestion], 'row')
  })

  it('adds the selected rows from the bulk bar', async () => {
    const [a, b, c] = [buildSuggestion(), buildSuggestion(), buildSuggestion()]
    const onAdd = jest.fn()
    render(<SuggestedContacts suggestions={[a, b, c]} canAdd onAdd={onAdd} />)

    await userEvent.click(screen.getByRole('checkbox', { name: `Select ${a.suggestedName}` }))
    await userEvent.click(screen.getByRole('checkbox', { name: `Select ${b.suggestedName}` }))

    const bar = screen.getByTestId('suggestions-bulk-bar')
    expect(within(bar).getByText('2 selected')).toBeInTheDocument()

    await userEvent.click(within(bar).getByRole('button', { name: 'Add 2 to workspace' }))

    expect(onAdd).toHaveBeenCalledWith([a, b], 'bulk')
  })

  it('clears the selection', async () => {
    const suggestion = buildSuggestion()
    render(<SuggestedContacts suggestions={[suggestion]} canAdd />)

    await userEvent.click(screen.getByRole('checkbox', { name: `Select ${suggestion.suggestedName}` }))
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(screen.queryByTestId('suggestions-bulk-bar')).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: `Select ${suggestion.suggestedName}` })).not.toBeChecked()
  })

  it('renders no checkboxes or add buttons when the member cannot add', () => {
    render(<SuggestedContacts suggestions={[buildSuggestion(), buildSuggestion()]} canAdd={false} />)

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add to workspace' })).not.toBeInTheDocument()
  })

  it('renders the row action for members', () => {
    const suggestion = buildSuggestion()
    const label = faker.lorem.word()
    render(
      <SuggestedContacts
        suggestions={[suggestion]}
        canAdd={false}
        renderRowAction={(item) => <button type="button">{`${label} ${item.suggestedName}`}</button>}
      />,
    )

    expect(screen.getByRole('button', { name: `${label} ${suggestion.suggestedName}` })).toBeInTheDocument()
  })

  it('shows the reason for each suggestion', () => {
    render(<SuggestedContacts suggestions={[buildSuggestion(['Treasury', 'Payroll'])]} canAdd />)

    expect(screen.getByTestId('suggestion-reason')).toHaveTextContent('Signer of Treasury, Payroll')
  })
})
