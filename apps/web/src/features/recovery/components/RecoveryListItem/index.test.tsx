import { useContext } from 'react'
import { userEvent } from '@testing-library/user-event'

import { render } from '@/tests/test-utils'
import RecoveryListItem from '.'
import { RecoveryListItemContext } from './RecoveryListItemContext'
import type { RecoveryQueueItem } from '../../services/recovery-state'

const MockRecoverySummary = () => {
  const { setSubmitError } = useContext(RecoveryListItemContext)
  return (
    <div>
      Account recovery
      <button type="button" onClick={() => setSubmitError(new Error('Execution failed'))}>
        Fail
      </button>
    </div>
  )
}

jest.mock('../RecoverySummary', () => ({
  __esModule: true,
  default: () => <MockRecoverySummary />,
}))

jest.mock('../RecoveryDetails', () => ({
  __esModule: true,
  default: () => <div>Recovery details</div>,
}))

const item = { transactionHash: '0x123' } as RecoveryQueueItem

describe('RecoveryListItem', () => {
  it('renders as a collapsed transaction list row', () => {
    const { getByTestId, getByText, queryByText } = render(<RecoveryListItem item={item} />)

    expect(getByTestId('recovery-item')).toBeInTheDocument()
    expect(getByText('Account recovery')).toBeInTheDocument()
    expect(queryByText('Recovery details')).not.toBeInTheDocument()
  })

  it('expands and collapses when the row is clicked', async () => {
    const { getByRole, getByText, queryByText } = render(<RecoveryListItem item={item} />)

    await userEvent.click(getByRole('button', { name: /Account recovery/ }))
    expect(getByText('Recovery details')).toBeInTheDocument()

    await userEvent.click(getByRole('button', { name: /Account recovery/ }))
    expect(queryByText('Recovery details')).not.toBeInTheDocument()
  })

  it('expands when a submit error is set from within the row', async () => {
    const { getByRole, getByText } = render(<RecoveryListItem item={item} />)

    await userEvent.click(getByRole('button', { name: 'Fail' }))

    expect(getByText('Recovery details')).toBeInTheDocument()
  })
})
