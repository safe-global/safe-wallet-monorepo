import { renderWithUserEvent, waitFor } from '@/tests/test-utils'
import CurrencySelect from '@/components/balances/CurrencySelect'

describe('CurrencySelect', () => {
  it('Should render the fetched currencies and select one', async () => {
    const { user, getByRole, getByTestId, findAllByTestId } = renderWithUserEvent(<CurrencySelect />)
    const select = getByRole('combobox')

    // The trigger shows the current currency
    expect(getByTestId('currency-selector')).toHaveTextContent('USD')

    // Open the dropdown
    await user.click(select)

    // The fetched currencies render as options in the portal
    const menuItems = await findAllByTestId('currency-item')

    expect(menuItems.length).toBe(3)
    expect(menuItems[0]).toHaveTextContent('USD')
    expect(menuItems[1]).toHaveTextContent('EUR')
    expect(menuItems[2]).toHaveTextContent('GBP')

    // Selecting an option dispatches the currency change and updates the trigger
    await user.click(menuItems[1])

    await waitFor(() => {
      expect(getByTestId('currency-selector')).toHaveTextContent('EUR')
    })
  })
})
