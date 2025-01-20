import { renderWithUserEvent } from '@/tests/test-utils'
import CurrencySelect from '@/components/balances/CurrencySelect'

describe('useCurrencies', () => {
  it('Should render the fetched', async () => {
    const { user, getByRole, findAllByTestId, getByLabelText } = renderWithUserEvent(<CurrencySelect />)
    const select = getByRole('combobox')

    expect(getByLabelText('USD')).toBeTruthy()

    await user.click(select)

    const menuItems = await findAllByTestId('currency-item')

    expect(menuItems.length).toBe(3)
    expect(menuItems[0]).toHaveTextContent('USD')
    expect(menuItems[1]).toHaveTextContent('EUR')
    expect(menuItems[2]).toHaveTextContent('GBP')
  })
})
