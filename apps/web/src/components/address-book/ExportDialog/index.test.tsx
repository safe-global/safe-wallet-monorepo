import { faker } from '@faker-js/faker'
import { _getCsvData } from '.'
import ExportDialog, { CsvExportDialog } from '.'
import { fakerChecksummedAddress, render, screen, waitFor, fireEvent } from '@/tests/test-utils'

jest.mock('@/services/analytics')

const contact = (): [string, string] => [fakerChecksummedAddress(), faker.person.firstName()]

describe('ExportDialog', () => {
  describe('getCsvData', () => {
    it('should format the address book correctly', () => {
      const addressBooks = {
        '4': {
          '0x0': 'John Smith',
          '0x1': 'Jane Doe',
        },
        '100': {
          '0x0': 'John Smith',
          '0x2': 'Alice Cooper',
        },
      }

      expect(_getCsvData(addressBooks)).toStrictEqual([
        { address: '0x0', name: 'John Smith', chainId: '4' },
        { address: '0x1', name: 'Jane Doe', chainId: '4' },
        { address: '0x0', name: 'John Smith', chainId: '100' },
        { address: '0x2', name: 'Alice Cooper', chainId: '100' },
      ])
    })
  })

  it('should render the export dialog', () => {
    const onClose = jest.fn()
    render(<ExportDialog handleClose={onClose} />)
    expect(screen.getByText('Export address book')).toBeInTheDocument()
  })

  describe('with entries on two chains', () => {
    const mainnet = [contact(), contact()]
    const sepolia = [contact()]
    const addressBook = { '1': Object.fromEntries(mainnet), '11155111': Object.fromEntries(sepolia) }

    it('shows the number of entries across all chains', () => {
      render(<ExportDialog handleClose={jest.fn()} />, { initialReduxState: { addressBook } })

      expect(screen.getByTestId('export-summary')).toHaveTextContent('3 address book entries')
    })

    it('downloads a CSV with one row per entry of every chain', async () => {
      const createObjectURL = jest.fn<string, [Blob]>(() => 'blob:address-book')
      window.URL.createObjectURL = createObjectURL
      const anchorClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      render(<ExportDialog handleClose={jest.fn()} />, { initialReduxState: { addressBook } })

      fireEvent.click(screen.getByTestId('export-modal-btn'))

      await waitFor(() => expect(anchorClick).toHaveBeenCalled())
      const csv = (await createObjectURL.mock.calls[0][0].text()).trim()
      expect(csv.split(/\r?\n/)).toEqual([
        'address,name,chainId',
        ...mainnet.map(([address, name]) => `${address},${name},1`),
        ...sepolia.map(([address, name]) => `${address},${name},11155111`),
      ])
      const anchor = anchorClick.mock.contexts[0] as HTMLAnchorElement
      expect(anchor.getAttribute('download')).toMatch(/^safe-address-book-\d{4}-\d{2}-\d{2}/)

      anchorClick.mockRestore()
    })
  })

  describe('CsvExportDialog', () => {
    it('downloads the rows it is given under its file name and reports the export', async () => {
      const rows = [{ address: fakerChecksummedAddress(), name: faker.person.firstName(), chainId: '1', tags: 'Ops' }]
      const onExport = jest.fn()
      const createObjectURL = jest.fn<string, [Blob]>(() => 'blob:address-book')
      window.URL.createObjectURL = createObjectURL
      const anchorClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      render(<CsvExportDialog csvData={rows} filename="workspace-7" onExport={onExport} handleClose={jest.fn()} />)

      expect(screen.getByTestId('export-summary')).toHaveTextContent('1 address book entry')
      fireEvent.click(screen.getByTestId('export-modal-btn'))

      await waitFor(() => expect(anchorClick).toHaveBeenCalled())
      const csv = (await createObjectURL.mock.calls[0][0].text()).trim()
      expect(csv.split(/\r?\n/)).toEqual(['address,name,chainId,tags', `${rows[0].address},${rows[0].name},1,Ops`])
      expect((anchorClick.mock.contexts[0] as HTMLAnchorElement).getAttribute('download')).toMatch(/^workspace-7/)
      expect(onExport).toHaveBeenCalled()

      anchorClick.mockRestore()
    })
  })
})
