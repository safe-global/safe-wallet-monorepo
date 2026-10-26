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
jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: () => mockUseIsMobile() }))

const mockUseAddressBook = jest.fn(() => mockAddressBook)
jest.mock('@/hooks/useAddressBook', () => ({ __esModule: true, default: () => mockUseAddressBook() }))
jest.mock('@/hooks/useChains', () => ({ useCurrentChain: () => undefined }))
jest.mock('@/hooks/useDarkMode', () => ({ useDarkMode: () => false }))

const mockSetTxFlow = jest.fn()
jest.mock('@/components/tx-flow', () => ({
  TxModalContext: createContext({ setTxFlow: (flow: ReactNode) => mockSetTxFlow(flow) }),
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
    jest.clearAllMocks()
    mockUseIsMobile.mockReturnValue(false)
    mockUseAddressBook.mockReturnValue(mockAddressBook)
  })

  it('shows the name and the address of each entry in its row', () => {
    render(<AddressBookTable />)

    const firstRow = screen.getByText('Contact 1', { exact: true }).closest('tr') as HTMLElement
    expect(within(firstRow).getByText(`0x${'1'.padStart(40, '0')}`)).toBeInTheDocument()
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

  it("opens a token transfer to the row's address when Send is clicked", () => {
    render(<AddressBookTable />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Send' })[0])

    expect(mockSetTxFlow).toHaveBeenCalledWith(
      expect.objectContaining({ props: { recipients: [{ recipient: `0x${'1'.padStart(40, '0')}` }] } }),
    )
  })

  it('sorts the rows by name and by address when the headers are clicked', () => {
    const [lowAddress, midAddress, highAddress] = ['0x1', '0x2', '0x3'].map((prefix) => prefix.padEnd(42, '0'))
    mockUseAddressBook.mockReturnValue({ [highAddress]: 'Bob', [midAddress]: 'Alice', [lowAddress]: 'Carol' })
    render(<AddressBookTable />)
    const firstRowName = () => within(screen.getAllByTestId('table-row')[0]).getByTestId('table-cell-name')
    expect(firstRowName()).toHaveTextContent('Bob')

    fireEvent.click(screen.getByRole('button', { name: /^Name/ }))
    expect(firstRowName()).toHaveTextContent('Alice')

    fireEvent.click(screen.getByRole('button', { name: /^Address/ }))
    expect(firstRowName()).toHaveTextContent('Carol')
  })
})
