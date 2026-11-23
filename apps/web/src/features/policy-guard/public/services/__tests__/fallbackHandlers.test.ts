import { faker } from '@faker-js/faker'
import { getTokenCallbackHandlerAddress, isTokenCallbackHandler } from '../fallbackHandlers'

const TOKEN_CALLBACK_HANDLER = '0x54e86d004d71a8D2112ec75FaCE57D730b0433F3'

describe('getTokenCallbackHandlerAddress', () => {
  it('should return the 1.5.0 TokenCallbackHandler, when the chain is Ethereum', () => {
    expect(getTokenCallbackHandlerAddress('1')).toBe(TOKEN_CALLBACK_HANDLER)
  })

  it('should return the 1.5.0 TokenCallbackHandler, when the chain is Polygon', () => {
    expect(getTokenCallbackHandlerAddress('137')).toBe(TOKEN_CALLBACK_HANDLER)
  })

  it('should return the 1.5.0 TokenCallbackHandler, when the chain is Sepolia', () => {
    expect(getTokenCallbackHandlerAddress('11155111')).toBe(TOKEN_CALLBACK_HANDLER)
  })

  it('should return nothing, when the chain has no deployment', () => {
    expect(getTokenCallbackHandlerAddress('100000000000')).toBeUndefined()
  })
})

describe('isTokenCallbackHandler', () => {
  it('should be true, when the address is the TokenCallbackHandler in any case', () => {
    expect(isTokenCallbackHandler('11155111', TOKEN_CALLBACK_HANDLER.toLowerCase())).toBe(true)
  })

  it('should be false, when the address is another handler', () => {
    expect(isTokenCallbackHandler('11155111', faker.finance.ethereumAddress())).toBe(false)
  })

  it('should be false, when the Safe has no fallback handler', () => {
    expect(isTokenCallbackHandler('11155111', undefined)).toBe(false)
  })
})
