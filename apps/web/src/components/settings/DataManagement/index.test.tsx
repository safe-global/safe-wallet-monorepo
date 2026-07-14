import { render, screen } from '@/tests/test-utils'
import DataManagement from '.'

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

    expect(screen.getByText('Data export').closest('[data-slot="card"]')).toHaveClass('mb-4')
    expect(screen.getByText('Data import').closest('[data-slot="card"]')).toHaveClass('mb-4')
    expect(screen.getByText('Pending transactions').closest('[data-slot="card"]')).toHaveClass('p-8')
    expect(screen.getByTestId('file-list-card')).toBeInTheDocument()
    expect(screen.getByTestId('import-file-upload')).toBeInTheDocument()
    expect(screen.getByTestId('clear-pending-txs')).toBeInTheDocument()
  })
})
