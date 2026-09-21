import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { persistBlacklist, persistTransforms, cgwClientFilter, walletKitPersistConfig } from '../index'

describe('persistConfig', () => {
  it('should not blacklist cgwClient to allow transform filtering', () => {
    expect(persistBlacklist).not.toContain(cgwClient.reducerPath)
  })

  it('should include cgwClientFilter in transforms', () => {
    expect(persistTransforms).toContain(cgwClientFilter)
  })
})

describe('walletKit nested persist', () => {
  it('persists only verifyByTopic', () => {
    expect(walletKitPersistConfig.whitelist).toEqual(['verifyByTopic'])
  })

  it('keeps the walletKit slice in the root blacklist so sessions stay volatile', () => {
    expect(persistBlacklist).toContain('walletKit')
  })
})
