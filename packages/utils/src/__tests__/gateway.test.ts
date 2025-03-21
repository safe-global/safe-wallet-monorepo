import { getExplorerLink, getHashedExplorerUrl, _replaceTemplate } from '@safe-global/utils/gateway'

describe('gateway', () => {
  describe('replaceTemplate', () => {
    it('should replace template syntax with data', () => {
      const uri = 'Hello {{this}}'
      const data = { this: 'world' }

      const result = _replaceTemplate(uri, data)
      expect(result).toEqual('Hello world')
    })
    it("shouldn't replace non-template text", () => {
      const uri = 'Hello this'
      const data = { this: 'world' }

      const result = _replaceTemplate(uri, data)
      expect(result).toEqual('Hello this')
    })
  })

  describe('getHashedExplorerUrl', () => {
    it('should return a url with a transaction hash', () => {
      const txHash = '0x4d32cc132307cde65b44162156f961ed421a84f83bb8cf3730c91f53374cc5de'

      const result = getHashedExplorerUrl(txHash, {
        address: 'https://etherscan.io/address/{{address}}',
        txHash: 'https://etherscan.io/tx/{{txHash}}',
        api: 'https://api.etherscan.io/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}',
      })

      expect(result).toEqual(
        'https://etherscan.io/tx/0x4d32cc132307cde65b44162156f961ed421a84f83bb8cf3730c91f53374cc5de',
      )
    })
    it('should return a url with an address', () => {
      const address = '0xabcdbc2ecb47642ee8cf52fd7b88fa42fbb69f98'

      const result = getHashedExplorerUrl(address, {
        address: 'https://etherscan.io/address/{{address}}',
        txHash: 'https://etherscan.io/tx/{{txHash}}',
        api: 'https://api.etherscan.io/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}',
      })

      expect(result).toEqual('https://etherscan.io/address/0xabcdbc2ecb47642ee8cf52fd7b88fa42fbb69f98')
    })
  })

  describe('getExplorerLink', () => {
    it('should return an object with a href and title', () => {
      const address = '0xabcdbc2ecb47642ee8cf52fd7b88fa42fbb69f98'

      const { href, title } = getExplorerLink(address, {
        address: 'https://etherscan.io/address/{{address}}',
        txHash: 'https://etherscan.io/tx/{{txHash}}',
        api: 'https://api.etherscan.io/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}',
      })

      expect(href).toEqual('https://etherscan.io/address/0xabcdbc2ecb47642ee8cf52fd7b88fa42fbb69f98')
      expect(title).toEqual('View on etherscan.io')
    })
  })
})
