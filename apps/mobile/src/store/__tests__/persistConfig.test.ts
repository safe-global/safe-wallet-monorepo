import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { persistBlacklist, persistTransforms, cgwClientFilter } from '../index'

describe('persistConfig', () => {
  it('should not blacklist cgwClient to allow transform filtering', () => {
    expect(persistBlacklist).not.toContain(cgwClient.reducerPath)
  })

  it('should include cgwClientFilter in transforms', () => {
    expect(persistTransforms).toContain(cgwClientFilter)
  })
})
