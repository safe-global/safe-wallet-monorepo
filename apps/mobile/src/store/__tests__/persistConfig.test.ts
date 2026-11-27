import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { persistBlacklist, persistTransforms, cgwClientFilter, walletKitPersistConfig } from '../index'

describe('persistConfig', () => {
  it('should not blacklist cgwClient to allow transform filtering', () => {
    expect(persistBlacklist).not.toContain(cgwClient.reducerPath)
  })

  it('keeps the Hypernative API cache, which holds the Authorization value, off the device', () => {
    expect(persistBlacklist).toContain(hypernativeApi.reducerPath)
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
