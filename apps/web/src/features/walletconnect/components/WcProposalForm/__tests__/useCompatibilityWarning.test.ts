import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { renderHook, getAppName } from '@/tests/test-utils'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { WalletKitTypes } from '@reown/walletkit'
import { useCompatibilityWarning } from '../useCompatibilityWarning'
import * as wcUtils from '@/features/walletconnect/services/utils'

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
        message: `Fake dApp does not support this Safe Account's network (this network). Please switch to a Safe Account on one of the supported networks below.`,
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
        message: `This dApp does not support this Safe Account's network (this network). Please switch to a Safe Account on one of the supported networks below.`,
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

      const { result } = renderHook(() => useCompatibilityWarning(proposal, false), {
        initialReduxState: {
          chains: {
            loading: false,
            loaded: true,
            error: undefined,
            data: [
              {
                chainId: '1',
                chainName: 'Ethereum',
              },
            ] as unknown as Array<ChainInfo>,
          },
          safeInfo: {
            loading: false,
            loaded: true,
            error: undefined,
            data: {
              ...extendedSafeInfoBuilder().build(),
              address: { value: '' },
              chainId: '1',
            },
          },
        },
      })

      expect(result.current).toEqual({
        message: 'Please make sure that the dApp is connected to Ethereum.',
        severity: 'info',
      })
    })

    it("if chains aren't loaded", () => {
      jest.spyOn(wcUtils, 'isBlockedBridge').mockReturnValue(false)
      jest.spyOn(wcUtils, 'isWarnedBridge').mockReturnValue(false)

      const proposal = {
        params: { proposer: { metadata: { name: 'Fake dApp' } } },
        verifyContext: { verified: { origin: '' } },
      } as unknown as WalletKitTypes.SessionProposal

      const { result } = renderHook(() => useCompatibilityWarning(proposal, false))

      expect(result.current).toEqual({
        message: 'Please make sure that the dApp is connected to this network.',
        severity: 'info',
      })
    })
  })
})
