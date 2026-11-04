let mockHeavyModulesLoaded: string[] = []

jest.mock('@/utils/transaction-errors', () => {
  mockHeavyModulesLoaded.push('transaction-errors')
  return jest.requireActual('@/utils/transaction-errors')
})

describe('policy-guard bundle boundary', () => {
  it('keeps the RPC error helpers and their contract ABIs out of the always-loaded barrel', () => {
    mockHeavyModulesLoaded = []
    jest.isolateModules(() => {
      require('../index')
    })
    expect(mockHeavyModulesLoaded).toEqual([])
  })
})
