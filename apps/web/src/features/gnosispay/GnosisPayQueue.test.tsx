import { render, screen } from '@/tests/test-utils'
import { GnosisPayQueue } from './GnosisPayQueue'
import { useGnosisPayQueue } from './hooks/useGnosisPayQueue'
jest.mock('./hooks/useGnosisPayQueue')
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
