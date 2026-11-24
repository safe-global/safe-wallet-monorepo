import { faker } from '@faker-js/faker'
import type { GnosisPayTxItem } from './types'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { GnosisPayQueue } from './GnosisPayQueue'
import { useGnosisPayQueue } from './hooks/useGnosisPayQueue'
jest.mock('./hooks/useGnosisPayQueue')
jest.mock('./hooks/useIsGnosisPayOwner', () => ({ useIsGnosisPayOwner: () => [true, undefined, false] }))
jest.mock('@/hooks/useIsWrongChain', () => () => false)
jest.mock('./GnosisPayTxDetails', () => ({ GnosisPayTxDetails: () => <div>Transaction details</div> }))
const mockQueue = jest.mocked(useGnosisPayQueue)
it('shows a loading state', () => {
  mockQueue.mockReturnValue([undefined, undefined, true])
  render(<GnosisPayQueue />)
  expect(screen.getByRole('status')).toHaveTextContent('Loading Gnosis Pay queue')
})
it('keeps a failed read visible', () => {
  mockQueue.mockReturnValue([undefined, new Error('RPC unavailable'), false])
  render(<GnosisPayQueue />)
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load the Gnosis Pay queue')
})
it('renders no rows for an empty queue', () => {
  mockQueue.mockReturnValue([[], undefined, false])
  render(<GnosisPayQueue />)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.queryByTestId('transaction-item')).not.toBeInTheDocument()
})

it('keeps the expanded transaction and Execute button mounted during a background refresh', async () => {
  const item: GnosisPayTxItem = {
    isNext: true,
    queueNonce: 0,
    txData: { to: faker.finance.ethereumAddress(), value: '0', data: '0x' },
    executableAt: 0,
    expiresAt: null,
  }
  mockQueue.mockReturnValue([[item], undefined, false])
  const { user, rerender } = renderWithUserEvent(<GnosisPayQueue />)
  await user.click(screen.getByTestId('transaction-item'))
  const details = await screen.findByText('Transaction details')
  const execute = screen.getByTestId('execute-btn')

  mockQueue.mockReturnValue([[item], undefined, true])
  rerender(<GnosisPayQueue />)

  expect(screen.getByText('Transaction details')).toBe(details)
  expect(details).toBeVisible()
  expect(screen.getByTestId('execute-btn')).toBe(execute)
  expect(execute).toBeEnabled()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()

  mockQueue.mockReturnValue([[{ ...item }], undefined, false])
  rerender(<GnosisPayQueue />)

  expect(screen.getByText('Transaction details')).toBe(details)
  expect(details).toBeVisible()
})
