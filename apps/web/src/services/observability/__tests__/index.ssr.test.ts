/**
 * @jest-environment node
 */
const mockProvider = {
  name: 'Mock',
  init: jest.fn().mockResolvedValue(undefined),
  getLogger: jest.fn(),
  captureError: jest.fn(),
}

jest.mock('../factory', () => ({
  createObservabilityProvider: jest.fn(() => mockProvider),
}))

import { initObservability } from '../index'

describe('initObservability on the server', () => {
  it('should be a no-op', () => {
    initObservability()

    expect(mockProvider.init).not.toHaveBeenCalled()
  })
})
