import { screen } from '@testing-library/react'

import { render } from '../test-utils'
import TransactionLibrary from './TransactionLibrary'
import { Batch } from '../typings/models'

const mockUseTransactionLibrary = jest.fn()

jest.mock('../store', () => ({
  __esModule: true,
  ...jest.requireActual('../store'),
  useTransactionLibrary: () => mockUseTransactionLibrary(),
}))

jest.mock('../assets/empty-library-dark.svg', () => ({ ReactComponent: () => null }))
jest.mock('../assets/empty-library-light.svg', () => ({ ReactComponent: () => null }))

const batch: Batch = { id: 'batch-1', name: 'My batch', transactions: [] }

const setBatches = (batches: Batch[]) =>
  mockUseTransactionLibrary.mockReturnValue({
    batches,
    removeBatch: jest.fn(),
    executeBatch: jest.fn(),
    downloadBatch: jest.fn(),
    renameBatch: jest.fn(),
  })

describe('<TransactionLibrary>', () => {
  it('shows the title and saved batches when the library is not empty', () => {
    setBatches([batch])
    render(<TransactionLibrary />)

    expect(screen.getByText('Your transaction library')).toBeInTheDocument()
    expect(screen.getByText('My batch')).toBeInTheDocument()
    expect(screen.queryByText("You don't have any saved batches.")).not.toBeInTheDocument()
  })

  it('shows only the empty state when there are no saved batches', () => {
    setBatches([])
    render(<TransactionLibrary />)

    expect(screen.queryByText('Your transaction library')).not.toBeInTheDocument()
    expect(screen.getByText("You don't have any saved batches.")).toBeInTheDocument()
  })
})
