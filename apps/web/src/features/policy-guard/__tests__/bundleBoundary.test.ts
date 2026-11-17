let mockHeavyModulesLoaded: string[] = []

jest.mock('@/utils/transaction-errors', () => {
  mockHeavyModulesLoaded.push('transaction-errors')
  return jest.requireActual('@/utils/transaction-errors')
})

describe('policy-guard bundle boundary', () => {
  it.each([
    'services/allowlistAvailability',
    'constants',
    'services/policyEngineDeployments',
    'types',
    'hooks/useAllowlistAvailability',
    'hooks/useIsAllowlistActiveInSpace',
    'hooks/usePolicyGuard',
  ])('keeps the RPC error helpers and their contract ABIs out of public/%s', (file) => {
    mockHeavyModulesLoaded = []
    jest.isolateModules(() => {
      require(`../public/${file}`)
    })
    expect(mockHeavyModulesLoaded).toEqual([])
  })
})
