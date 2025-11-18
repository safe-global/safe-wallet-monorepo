import { renderHook, getAppName } from '@/tests/test-utils'
import type { WalletKitTypes } from '@reown/walletkit'
import { useCompatibilityWarning } from '../useCompatibilityWarning'
import * as wcUtils from '@/features/walletconnect/services/utils'

// Mock useChains to return chain configs with Ethereum
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    configs: [
      {
        chainId: '1',
        chainName: 'Ethereum',
      },
    ],
    error: undefined,
    loading: false,
  })),
}))

// Mock useSafeInfo to return a safe with chainId '1'
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    safe: {
      chainId: '1',
      address: { value: '0x0000000000000000000000000000000000000001' },
    },
    safeLoaded: true,
  })),
}))

describe('useCompatibilityWarning', () => {
  describe('should return an error for a dangerous bridge', () => {
    it('if the dApp is named', () => {
      jest.spyOn(wcUtils, 'isBlockedBridge').mockReturnValue(true)

      const proposal = {
        params: { proposer: { metadata: { name: 'Fake Bridge' } } },
        verifyContext: { verified: { origin: '' } },
      } as unknown as WalletKitTypes.SessionProposal

      const { result } = renderHook(() => useCompatibilityWarning(proposal, false))

      const appName = getAppName()

      expect(result.current).toEqual({
        message: `Fake Bridge is a bridge that is incompatible with ${appName} — the bridged funds will be lost. Consider using a different bridge.`,
        severity: 'error',
      })
    })

    it('if the dApp is not named', () => {
      jest.spyOn(wcUtils, 'isBlockedBridge').mockReturnValue(true)

      const proposal = {
        params: { proposer: { metadata: { name: '' } } },
        verifyContext: { verified: { origin: '' } },
      } as unknown as WalletKitTypes.SessionProposal

      const { result } = renderHook(() => useCompatibilityWarning(proposal, false))

      const appName = getAppName()

      expect(result.current).toEqual({
        message: `This dApp is a bridge that is incompatible with ${appName} — the bridged funds will be lost. Consider using a different bridge.`,
        severity: 'error',
      })
    })
  })

  describe('should return a warning for a risky bridge', () => {
    it('if the dApp is named', () => {
      jest.spyOn(wcUtils, 'isBlockedBridge').mockReturnValue(false)
      jest.spyOn(wcUtils, 'isWarnedBridge').mockReturnValue(true)

      const proposal = {
        params: { proposer: { metadata: { name: 'Fake Bridge' } } },
        verifyContext: { verified: { origin: '' } },
      } as unknown as WalletKitTypes.SessionProposal

      const { result } = renderHook(() => useCompatibilityWarning(proposal, false))

      expect(result.current).toEqual({
        message:
          'While bridging via Fake Bridge, please make sure that the desination address you send funds to matches the Safe address you have on the respective chain. Otherwise, the funds will be lost.',
        severity: 'warning',
      })
    })

    it('if the dApp is not named', () => {
      jest.spyOn(wcUtils, 'isBlockedBridge').mockReturnValue(false)
      jest.spyOn(wcUtils, 'isWarnedBridge').mockReturnValue(true)

      const proposal = {
        params: { proposer: { metadata: { name: '' } } },
        verifyContext: { verified: { origin: '' } },
      } as unknown as WalletKitTypes.SessionProposal

      const { result } = renderHook(() => useCompatibilityWarning(proposal, false))

      expect(result.current).toEqual({
        message:
          'While bridging via this dApp, please make sure that the desination address you send funds to matches the Safe address you have on the respective chain. Otherwise, the funds will be lost.',
        severity: 'warning',
      })
    })
  })

  describe('it should return an error for an unsupported chain', () => {
    it('if the dApp is named', () => {
      jest.spyOn(wcUtils, 'isBlockedBridge').mockReturnValue(false)
      jest.spyOn(wcUtils, 'isWarnedBridge').mockReturnValue(false)

      const proposal = {
        params: { proposer: { metadata: { name: 'Fake dApp' } } },
        verifyContext: { verified: { origin: '' } },
      } as unknown as WalletKitTypes.SessionProposal

      const { result } = renderHook(() => useCompatibilityWarning(proposal, true))

      expect(result.current).toEqual({
        message: `Fake dApp does not support this Safe Account's network (Ethereum). Please switch to a Safe Account on one of the supported networks below.`,
        severity: 'error',
      })
    })

    it('if the dApp is not named', () => {
      jest.spyOn(wcUtils, 'isBlockedBridge').mockReturnValue(false)
      jest.spyOn(wcUtils, 'isWarnedBridge').mockReturnValue(false)

      const proposal = {
        params: { proposer: { metadata: { name: '' } } },
        verifyContext: { verified: { origin: '' } },
      } as unknown as WalletKitTypes.SessionProposal

      const { result } = renderHook(() => useCompatibilityWarning(proposal, true))

      expect(result.current).toEqual({
        message: `This dApp does not support this Safe Account's network (Ethereum). Please switch to a Safe Account on one of the supported networks below.`,
        severity: 'error',
      })
    })
  })

  describe('should otherwise return info', () => {
    it('if chains are loaded', () => {
      jest.spyOn(wcUtils, 'isBlockedBridge').mockReturnValue(false)
      jest.spyOn(wcUtils, 'isWarnedBridge').mockReturnValue(false)

      const proposal = {
        params: { proposer: { metadata: { name: 'Fake dApp' } } },
        verifyContext: { verified: { origin: '' } },
      } as unknown as WalletKitTypes.SessionProposal

      const { result } = renderHook(() => useCompatibilityWarning(proposal, false))

      expect(result.current).toEqual({
        message: 'Please make sure that the dApp is connected to Ethereum.',
        severity: 'info',
      })
    })

    // Since we now always mock chains to be loaded, this test no longer makes sense
    // it("if chains aren't loaded", () => {
    //   jest.spyOn(wcUtils, 'isBlockedBridge').mockReturnValue(false)
    //   jest.spyOn(wcUtils, 'isWarnedBridge').mockReturnValue(false)

    //   const proposal = {
    //     params: { proposer: { metadata: { name: 'Fake dApp' } } },
    //     verifyContext: { verified: { origin: '' } },
    //   } as unknown as WalletKitTypes.SessionProposal

    //   const { result } = renderHook(() => useCompatibilityWarning(proposal, false))

    //   expect(result.current).toEqual({
    //     message: 'Please make sure that the dApp is connected to this network.',
    //     severity: 'info',
    //   })
    // })
  })
})
