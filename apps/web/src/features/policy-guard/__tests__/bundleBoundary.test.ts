let mockHeavyModulesLoaded: string[] = []

jest.mock('@/utils/transaction-errors', () => {
  mockHeavyModulesLoaded.push('transaction-errors')
  return jest.requireActual('@/utils/transaction-errors')
})

describe('policy-guard bundle boundary', () => {
  it.each([
    'allowlistAvailability',
    'constants',
    'policyEngineDeployments',
    'types',
    'useAllowlistAvailability',
    'useIsAllowlistActiveInSpace',
    'usePolicyGuard',
  ])('keeps the RPC error helpers and their contract ABIs out of public/%s', (file) => {
    mockHeavyModulesLoaded = []
    jest.isolateModules(() => {
      require(`../public/${file}`)
    })
    expect(mockHeavyModulesLoaded).toEqual([])
  })
})
