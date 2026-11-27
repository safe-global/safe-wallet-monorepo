import { setBaseUrl } from '@safe-global/safe-gateway-typescript-sdk'
import { configureGateway } from './gateway'

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({ setBaseUrl: jest.fn() }))

describe('configureGateway', () => {
  beforeEach(() => jest.clearAllMocks())

  it('points the gateway SDK at the configured Client Gateway', () => {
    configureGateway('http://localhost:8000/cgw')
    expect(setBaseUrl).toHaveBeenCalledWith('http://localhost:8000/cgw')
  })

  it('keeps the production gateway when none is configured', () => {
    configureGateway(undefined)
    expect(setBaseUrl).not.toHaveBeenCalled()
  })
})
