import type { ReplayedSafeProps } from '../../types'
import { toBackendDto, fromBackendDto } from '../counterfactualSafeMapper'

const mockReplayedSafeProps: ReplayedSafeProps = {
  factoryAddress: '0xFactoryAddress',
  masterCopy: '0xMasterCopy',
  saltNonce: '12345',
  safeVersion: '1.4.1',
  safeAccountConfig: {
    threshold: 2,
    owners: ['0xOwner1', '0xOwner2', '0xOwner3'],
    fallbackHandler: '0xFallbackHandler',
    to: '0xSetupTo',
    data: '0xSetupData',
    paymentToken: '0xPaymentToken',
    payment: 100,
    paymentReceiver: '0xPaymentReceiver',
  },
}

describe('counterfactualSafeMapper', () => {
  describe('toBackendDto', () => {
    it('should flatten ReplayedSafeProps into a backend DTO', () => {
      const result = toBackendDto('1', '0xSafeAddress', mockReplayedSafeProps)

      expect(result).toEqual({
        chainId: '1',
        address: '0xSafeAddress',
        factoryAddress: '0xFactoryAddress',
        masterCopy: '0xMasterCopy',
        saltNonce: '12345',
        safeVersion: '1.4.1',
        threshold: 2,
        owners: ['0xOwner1', '0xOwner2', '0xOwner3'],
        fallbackHandler: '0xFallbackHandler',
        to: '0xSetupTo',
        data: '0xSetupData',
        paymentToken: '0xPaymentToken',
        payment: '100',
        paymentReceiver: '0xPaymentReceiver',
      })
    })

    it('should handle optional fields being undefined', () => {
      const propsWithoutOptionals: ReplayedSafeProps = {
        ...mockReplayedSafeProps,
        safeAccountConfig: {
          ...mockReplayedSafeProps.safeAccountConfig,
          paymentToken: undefined,
          payment: undefined,
        },
      }

      const result = toBackendDto('1', '0xSafeAddress', propsWithoutOptionals)

      expect(result.paymentToken).toBeUndefined()
      expect(result.payment).toBeUndefined()
    })
  })

  describe('fromBackendDto', () => {
    it('should reconstruct ReplayedSafeProps from a flat DTO', () => {
      const dto = toBackendDto('1', '0xSafeAddress', mockReplayedSafeProps)
      const result = fromBackendDto(dto)

      expect(result).toEqual({
        chainId: '1',
        address: '0xSafeAddress',
        props: mockReplayedSafeProps,
      })
    })

    it('should handle optional fields being undefined', () => {
      const dto = toBackendDto('1', '0xSafeAddress', {
        ...mockReplayedSafeProps,
        safeAccountConfig: {
          ...mockReplayedSafeProps.safeAccountConfig,
          paymentToken: undefined,
          payment: undefined,
        },
      })

      const result = fromBackendDto(dto)

      expect(result.props.safeAccountConfig.paymentToken).toBeUndefined()
      expect(result.props.safeAccountConfig.payment).toBeUndefined()
    })

    it('normalizes nullable address fields from the schema to ZERO_ADDRESS', () => {
      // CGW's CounterfactualSafeDto / GetCounterfactualSafeItem mark
      // fallbackHandler, to, and paymentReceiver as nullable; downstream FE
      // code relies on string addresses, so the mapper must coerce null.
      const result = fromBackendDto({
        chainId: '1',
        address: '0xSafeAddress',
        factoryAddress: '0xF',
        masterCopy: '0xM',
        saltNonce: '0',
        safeVersion: '1.4.1',
        threshold: 1,
        owners: ['0xabc'],
        data: '0x',
        fallbackHandler: null,
        to: null,
        paymentReceiver: null,
        paymentToken: null,
        payment: null,
      })

      const ZERO = '0x0000000000000000000000000000000000000000'
      expect(result.props.safeAccountConfig.fallbackHandler).toBe(ZERO)
      expect(result.props.safeAccountConfig.to).toBe(ZERO)
      expect(result.props.safeAccountConfig.paymentReceiver).toBe(ZERO)
    })
  })

  describe('round-trip', () => {
    it('should preserve data through toBackendDto -> fromBackendDto', () => {
      const dto = toBackendDto('137', '0xSafeAddress', mockReplayedSafeProps)
      const { chainId, address, props } = fromBackendDto(dto)

      expect(chainId).toBe('137')
      expect(address).toBe('0xSafeAddress')
      expect(props).toEqual(mockReplayedSafeProps)
    })
  })
})
