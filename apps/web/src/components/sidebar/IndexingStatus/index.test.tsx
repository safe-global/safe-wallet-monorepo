import { render } from '@/tests/test-utils'
import IndexingStatus from './index'

jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(),
}))

import { formatDistanceToNow } from 'date-fns'
const mockFormatDistanceToNow = formatDistanceToNow as jest.Mock

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: jest.fn(() => '1'),
}))

jest.mock('@/hooks/useIntervalCounter', () => ({
  __esModule: true,
  default: jest.fn(() => [0]),
}))

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  __esModule: true,
  getIndexingStatus: jest.fn(),
}))

jest.mock('@safe-global/utils/hooks/useAsync', () => ({
  __esModule: true,
  default: jest.fn(() => [{ lastSync: 123, synced: true }]),
}))

describe('IndexingStatus', () => {
  it('formats lastSync in milliseconds', () => {
    render(<IndexingStatus />)

    expect(mockFormatDistanceToNow).toHaveBeenCalledWith(123000, { addSuffix: true })
  })
})
