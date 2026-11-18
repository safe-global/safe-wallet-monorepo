import { walletConnectServices } from '../walletConnectServices'

const mockUpdateSessions = jest.fn()
jest.mock('../../../services/walletConnectInstance', () => ({
  __esModule: true,
  default: { updateSessions: (...args: unknown[]) => mockUpdateSessions(...args) },
}))

describe('walletConnectServices.updateSessions', () => {
  it('forwards the chain and Safe to the WalletKit instance', async () => {
    await walletConnectServices.updateSessions('11155111', '0x0000000000000000000000000000000000000001')

    expect(mockUpdateSessions).toHaveBeenCalledWith('11155111', '0x0000000000000000000000000000000000000001')
  })
})
