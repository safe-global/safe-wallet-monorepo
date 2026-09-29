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

describe('initObservability on the server', () => {
  it('should be a no-op', () => {
    const { initObservability } = require('../index')
    initObservability()

    expect(mockProvider.init).not.toHaveBeenCalled()
  })
})
