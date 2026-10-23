import { render, screen, fakerChecksummedAddress } from '@/tests/test-utils'
import local from '@/services/local-storage/local'
import DataManagement, { exportAppData } from '.'

jest.mock('./FileListCard', () => ({
  FileListCard: () => <div data-testid="file-list-card" />,
}))

jest.mock('./ImportFileUpload', () => ({
  ImportFileUpload: () => <div data-testid="import-file-upload" />,
}))

jest.mock('../ClearPendingTxs', () => ({
  ClearPendingTxs: () => <div data-testid="clear-pending-txs" />,
}))

describe('DataManagement', () => {
  it('renders each data management section inside a shadcn settings card', () => {
    render(<DataManagement />)

    expect(screen.getByText('Data export').closest('[data-slot="card"]')).toBeInTheDocument()
    expect(screen.getByText('Data import').closest('[data-slot="card"]')).toBeInTheDocument()
    expect(screen.getByText('Pending transactions').closest('[data-slot="card"]')).toBeInTheDocument()
    expect(screen.getByTestId('file-list-card')).toBeInTheDocument()
    expect(screen.getByTestId('import-file-upload')).toBeInTheDocument()
    expect(screen.getByTestId('clear-pending-txs')).toBeInTheDocument()
    expect(screen.getByTestId('export-file-section')).toBeInTheDocument()
  })
})

describe('exportAppData', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    localStorage.clear()
  })

  it('downloads the stored data as a dated JSON file', async () => {
    const addressBook = { '11155111': { [fakerChecksummedAddress()]: 'Treasury' } }
    local.setItem('addressBook', addressBook)
    const createObjectURL = jest.fn<string, [Blob]>(() => 'blob:export')
    window.URL.createObjectURL = createObjectURL
    const downloads: string[] = []
    jest.spyOn(HTMLAnchorElement.prototype, 'dispatchEvent').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download)
      return true
    })

    exportAppData()

    expect(downloads).toEqual([`safe-${new Date().toISOString().slice(0, 10)}.json`])
    const exported = JSON.parse(await createObjectURL.mock.calls[0][0].text())
    expect(exported.data.addressBook).toEqual(addressBook)
  })
})
