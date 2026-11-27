import { faker } from '@faker-js/faker'

import { getGenericProxyMasterCopy, isGenericProxy, isGnosisProxy } from '@/services/delay/proxies'

describe('proxies', () => {
  describe('isGenericProxy', () => {
    it('should return true for a generic proxy', () => {
      const genericProxyBytecode =
        '0x363d3d373d3d3d363d73' + faker.string.hexadecimal({ length: 38 }) + '5af43d82803e903d91602b57fd5bf3'
      expect(isGenericProxy(genericProxyBytecode)).toBe(true)
    })

    it('should return false for a non-generic proxy', () => {
      const bytecode = '0x' + faker.string.hexadecimal()
      expect(isGenericProxy(bytecode)).toBe(false)
    })
  })

  describe('isGnosisGenericProxy', () => {
    it('should return true for a Gnosis generic proxy', () => {
      const gnosisGenericProxyBytecode =
        '0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea265627a7a72315820d8a00dc4fe6bf675a9d7416fc2d00bb3433362aa8186b750f76c4027269667ff64736f6c634300050e0032'
      expect(isGnosisProxy(gnosisGenericProxyBytecode)).toBe(true)
    })

    it('should return false for a non-Gnosis generic proxy', () => {
      const bytecode = '0x' + faker.string.hexadecimal()
      expect(isGnosisProxy(bytecode)).toBe(false)
    })
  })

  describe('getGenericProxyMasterCopy', () => {
    it('should return the master copy address', () => {
      const genericProxyBytecode =
        '0x363d3d373d3d3d363d73' + faker.string.hexadecimal({ length: 38 }) + '5af43d82803e903d91602b57fd5bf3'
      expect(getGenericProxyMasterCopy(genericProxyBytecode)).toBe('0x' + genericProxyBytecode.slice(22, 62))
    })
  })
})
