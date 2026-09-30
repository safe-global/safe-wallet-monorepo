import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from '@/components/ui/select'
import SafeDropdownContainer from '../SafeDropdownContainer'
import type { SafeItemData } from '../../types'

// Real base-ui Select (not mocked like in SafeDropdownContainer.test.tsx): the focus regression lives
// in base-ui's list navigation, which moves focus onto an option when one remounts mid-search.
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: () => null }))
jest.mock('@/hooks/useAllAddressBooks', () => ({
  useSafeNameResolver: () => (_address: string, _chainId: string | undefined, name?: string) => name ?? '',
}))
jest.mock('../SafeItem', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div>{name}</div>,
}))
jest.mock('@/components/common/SafeListSortToggle', () => ({ __esModule: true, default: () => null }))

const createItem = (id: string, name: string, address: string): SafeItemData => ({
  id,
  name,
  address,
  threshold: 1,
  owners: 1,
  balance: '0',
  chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
})

const alpha = createItem('1:0xaaaa', 'Alpha', '0xaaaa')
const beta = createItem('1:0xbbbb', 'Beta', '0xbbbb')

describe('SafeDropdownContainer search focus', () => {
  it('keeps focus in the search input while filtering the selected safe out, to zero results and back', async () => {
    const user = userEvent.setup()
    render(
      <Select open value={alpha.id}>
        <SafeDropdownContainer
          items={[alpha, beta]}
          selectedItemId={alpha.id}
          onItemSelect={jest.fn()}
          closeDropdown={jest.fn()}
        />
      </Select>,
    )
    const input = await screen.findByTestId('safe-dropdown-search-input')
    await user.hover(screen.getByText('Alpha'))
    await user.click(input)

    await user.type(input, 'beta')
    await user.clear(input)
    await user.type(input, 'zz{Backspace}{Backspace}')
    await user.type(input, 'alp')

    await waitFor(() => expect(input).toHaveFocus())
    expect(input).toHaveValue('alp')
  })
})
