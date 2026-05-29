import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UploadAddressBookTab from '../UploadAddressBookTab'
import { parseImportedAddressBook } from '../parseImportedAddressBook'

jest.mock('../parseImportedAddressBook', () => ({
  parseImportedAddressBook: jest.fn(),
}))

const mockParse = parseImportedAddressBook as jest.Mock

const uploadFile = (content = 'address,name,chainId') => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  const file = new File([content], 'book.csv', { type: 'text/csv' })
  fireEvent.change(input, { target: { files: [file] } })
}

const baseProps = {
  supportedChainIds: ['1', '5'],
  onImport: jest.fn(),
  onCancel: jest.fn(),
  isSubmitting: false,
  isSuccess: false,
}

describe('UploadAddressBookTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the drop zone and a disabled import button initially', () => {
    render(<UploadAddressBookTab {...baseProps} />)

    expect(screen.getByRole('button', { name: /import/i })).toBeDisabled()
  })

  it('shows a summary and enables import after a valid file is parsed', async () => {
    mockParse.mockReturnValue({
      items: [
        { address: '0x1', name: 'Alice', chainIds: ['1'] },
        { address: '0x2', name: 'Bob', chainIds: ['5'] },
      ],
    })

    render(<UploadAddressBookTab {...baseProps} />)
    uploadFile()

    await waitFor(() => expect(screen.getByText(/Found 2 entries on 2 chains/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /import/i })).not.toBeDisabled()
  })

  it('passes parsed items to onImport when import is clicked', async () => {
    const items = [{ address: '0x1', name: 'Alice', chainIds: ['1'] }]
    mockParse.mockReturnValue({ items })

    render(<UploadAddressBookTab {...baseProps} />)
    uploadFile()

    const importButton = await screen.findByRole('button', { name: /import/i })
    await waitFor(() => expect(importButton).not.toBeDisabled())
    fireEvent.click(importButton)

    expect(baseProps.onImport).toHaveBeenCalledWith(items)
  })

  it('shows the parse error and keeps import disabled', async () => {
    mockParse.mockReturnValue({ items: [], error: 'Invalid or corrupt address book header' })

    render(<UploadAddressBookTab {...baseProps} />)
    uploadFile()

    await waitFor(() => expect(screen.getByText('Invalid or corrupt address book header')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /import/i })).toBeDisabled()
  })

  it('shows a submit-level error passed from the parent', () => {
    render(<UploadAddressBookTab {...baseProps} submitError="Something went wrong. Please try again." />)

    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })

  it('calls onCancel when cancel is clicked', () => {
    render(<UploadAddressBookTab {...baseProps} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(baseProps.onCancel).toHaveBeenCalled()
  })
})
