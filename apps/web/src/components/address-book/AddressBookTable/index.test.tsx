import { fireEvent, render, screen, within } from '@testing-library/react'
import { createContext, type ReactNode } from 'react'
import AddressBookTable from './index'

const ENTRY_COUNT = 200

const mockAddressBook: Record<string, string> = Object.fromEntries(
  Array.from({ length: ENTRY_COUNT }, (_, index) => [
    `0x${String(index + 1).padStart(40, '0')}`,
    `Contact ${index + 1}`,
  ]),
)

const mockUseIsMobile = jest.fn(() => false)
jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mockUseIsMobile() }))

jest.mock('@/hooks/useAddressBook', () => ({ __esModule: true, default: () => mockAddressBook }))
jest.mock('@/hooks/useChains', () => ({ useCurrentChain: () => undefined }))
jest.mock('@/hooks/useDarkMode', () => ({ useDarkMode: () => false }))

jest.mock('@/components/tx-flow', () => ({
  TxModalContext: createContext({ setTxFlow: jest.fn() }),
}))
jest.mock('@/components/tx-flow/flows', () => ({ TokenTransferFlow: () => null }))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}))
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => ReactNode }) => children(true),
}))
jest.mock('@/components/common/EthHashInfo', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <span>{address}</span>,
}))

// The header only feeds the search query back to the table
jest.mock('../AddressBookHeader', () => ({
  __esModule: true,
  default: ({ onSearchQueryChange }: { onSearchQueryChange: (query: string) => void }) => (
    <input aria-label="Search" onChange={(event) => onSearchQueryChange(event.target.value)} />
  ),
}))

jest.mock('@/components/address-book/EntryDialog', () => ({
  __esModule: true,
  default: ({ defaultValues }: { defaultValues?: { address: string; name: string } }) => (
    <div data-testid="entry-dialog">{defaultValues?.name}</div>
  ),
}))
jest.mock('@/components/address-book/RemoveDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="remove-dialog" />,
}))
jest.mock('@/components/address-book/ExportDialog', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/address-book/ImportDialog', () => ({ __esModule: true, default: () => null }))

const goToSecondPage = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
  expect(screen.getByText(`26–50 of ${ENTRY_COUNT}`)).toBeInTheDocument()
}

describe('AddressBookTable', () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false)
  })

  it('stays on the current page when a row action opens the edit dialog', () => {
    render(<AddressBookTable />)
    goToSecondPage()

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit entry' })[0])

    expect(screen.getByTestId('entry-dialog')).toHaveTextContent('Contact 26')
    expect(screen.getByText(`26–50 of ${ENTRY_COUNT}`)).toBeInTheDocument()
    const table = within(screen.getByRole('table'))
    expect(table.getByText('Contact 26')).toBeInTheDocument()
    expect(table.queryByText('Contact 1')).not.toBeInTheDocument()
  })

  it('stays on the current page when a row action opens the delete dialog', () => {
    render(<AddressBookTable />)
    goToSecondPage()

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete entry' })[0])

    expect(screen.getByTestId('remove-dialog')).toBeInTheDocument()
    expect(screen.getByText(`26–50 of ${ENTRY_COUNT}`)).toBeInTheDocument()
  })

  it('returns to the first page when the search query changes the entries', () => {
    render(<AddressBookTable />)
    goToSecondPage()

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Contact 1' } })

    expect(screen.getByText('1–25 of 111')).toBeInTheDocument()
    expect(screen.getByText('Contact 1')).toBeInTheDocument()
  })
})
