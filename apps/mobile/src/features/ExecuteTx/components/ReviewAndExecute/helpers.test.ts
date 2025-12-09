import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { FeeParams } from '@/src/hooks/useFeeParams/useFeeParams'
import type { Signer } from '@/src/store/signersSlice'
import {
  getExecutionMethod,
  getSubmitButtonText,
  buildRouteParams,
  determineExecutionPath,
  getErrorMessage,
} from './helpers'

// Mock chain with relay feature enabled
const mockChainWithRelay = {
  chainId: '1',
  features: ['RELAYING'],
} as unknown as Chain

// Mock chain without relay feature
const mockChainWithoutRelay = {
  chainId: '1',
  features: [],
} as unknown as Chain

const mockPrivateKeySigner: Signer = {
  value: '0x123',
  name: 'Test Signer',
  type: 'private-key',
}

const mockLedgerSigner: Signer = {
  value: '0x456',
  name: 'Ledger Signer',
  type: 'ledger',
  derivationPath: "m/44'/60'/0'/0/0",
}

describe('helpers', () => {
  describe('getExecutionMethod', () => {
    it('should return WITH_RELAY when relay is requested and available', () => {
      const result = getExecutionMethod(ExecutionMethod.WITH_RELAY, true, mockChainWithRelay, mockPrivateKeySigner)
      expect(result).toBe(ExecutionMethod.WITH_RELAY)
    })

    it('should fallback to WITH_PK when relay is requested but not available', () => {
      const result = getExecutionMethod(ExecutionMethod.WITH_RELAY, false, mockChainWithRelay, mockPrivateKeySigner)
      expect(result).toBe(ExecutionMethod.WITH_PK)
    })

    it('should fallback to WITH_PK when relay is requested but chain does not support it', () => {
      const result = getExecutionMethod(ExecutionMethod.WITH_RELAY, true, mockChainWithoutRelay, mockPrivateKeySigner)
      expect(result).toBe(ExecutionMethod.WITH_PK)
    })

    it('should return WITH_PK when WITH_PK is requested with private key signer', () => {
      const result = getExecutionMethod(ExecutionMethod.WITH_PK, true, mockChainWithRelay, mockPrivateKeySigner)
      expect(result).toBe(ExecutionMethod.WITH_PK)
    })

    it('should return WITH_LEDGER when signer is Ledger and relay not requested', () => {
      const result = getExecutionMethod(ExecutionMethod.WITH_PK, true, mockChainWithRelay, mockLedgerSigner)
      expect(result).toBe(ExecutionMethod.WITH_LEDGER)
    })

    it('should return WITH_RELAY over WITH_LEDGER when relay is requested and available', () => {
      const result = getExecutionMethod(ExecutionMethod.WITH_RELAY, true, mockChainWithRelay, mockLedgerSigner)
      expect(result).toBe(ExecutionMethod.WITH_RELAY)
    })

    it('should fallback to WITH_LEDGER when relay not available and signer is Ledger', () => {
      const result = getExecutionMethod(ExecutionMethod.WITH_RELAY, false, mockChainWithRelay, mockLedgerSigner)
      expect(result).toBe(ExecutionMethod.WITH_LEDGER)
    })

    it('should return WITH_PK when no signer is provided', () => {
      const result = getExecutionMethod(ExecutionMethod.WITH_PK, true, mockChainWithRelay)
      expect(result).toBe(ExecutionMethod.WITH_PK)
    })
  })

  describe('getSubmitButtonText', () => {
    it('should return "Execute transaction" when funds are sufficient', () => {
      expect(getSubmitButtonText(true)).toBe('Execute transaction')
    })

    it('should return "Insufficient funds" when funds are not sufficient', () => {
      expect(getSubmitButtonText(false)).toBe('Insufficient funds')
    })
  })

  describe('buildRouteParams', () => {
    it('should build route params from fee params', () => {
      const feeParams: FeeParams = {
        maxFeePerGas: BigInt('1000000000'),
        maxPriorityFeePerGas: BigInt('100000000'),
        gasLimit: BigInt('21000'),
        nonce: 5,
        isLoadingGasPrice: false,
        gasLimitLoading: false,
      }

      const result = buildRouteParams('tx123', ExecutionMethod.WITH_PK, feeParams)

      expect(result).toEqual({
        txId: 'tx123',
        executionMethod: ExecutionMethod.WITH_PK,
        maxFeePerGas: '1000000000',
        maxPriorityFeePerGas: '100000000',
        gasLimit: '21000',
        nonce: '5',
      })
    })

    it('should handle undefined fee params values', () => {
      const feeParams: FeeParams = {
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        gasLimit: undefined,
        nonce: undefined,
        isLoadingGasPrice: true,
        gasLimitLoading: true,
      }

      const result = buildRouteParams('tx123', ExecutionMethod.WITH_RELAY, feeParams)

      expect(result).toEqual({
        txId: 'tx123',
        executionMethod: ExecutionMethod.WITH_RELAY,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        gasLimit: undefined,
        nonce: undefined,
      })
    })
  })

  describe('determineExecutionPath', () => {
    it('should return "ledger" when signer is a Ledger device', () => {
      expect(determineExecutionPath(mockLedgerSigner, true)).toBe('ledger')
      expect(determineExecutionPath(mockLedgerSigner, false)).toBe('ledger')
    })

    it('should return "standard" when relay is selected, even with Ledger signer', () => {
      expect(determineExecutionPath(mockLedgerSigner, true, ExecutionMethod.WITH_RELAY)).toBe('standard')
      expect(determineExecutionPath(mockLedgerSigner, false, ExecutionMethod.WITH_RELAY)).toBe('standard')
    })

    it('should return "standard" when relay is selected with private key signer', () => {
      expect(determineExecutionPath(mockPrivateKeySigner, true, ExecutionMethod.WITH_RELAY)).toBe('standard')
      expect(determineExecutionPath(mockPrivateKeySigner, false, ExecutionMethod.WITH_RELAY)).toBe('standard')
    })

    it('should return "biometrics" when biometrics is not enabled', () => {
      expect(determineExecutionPath(mockPrivateKeySigner, false)).toBe('biometrics')
    })

    it('should return "standard" when biometrics is enabled and signer is not Ledger', () => {
      expect(determineExecutionPath(mockPrivateKeySigner, true)).toBe('standard')
    })

    it('should return "biometrics" when signer is undefined and biometrics not enabled', () => {
      expect(determineExecutionPath(undefined, false)).toBe('biometrics')
    })

    it('should return "standard" when signer is undefined and biometrics enabled', () => {
      expect(determineExecutionPath(undefined, true)).toBe('standard')
    })
  })

  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Something went wrong')
      expect(getErrorMessage(error)).toBe('Something went wrong')
    })

    it('should return default message for non-Error objects', () => {
      expect(getErrorMessage('string error')).toBe('Failed to execute transaction')
      expect(getErrorMessage({ foo: 'bar' })).toBe('Failed to execute transaction')
      expect(getErrorMessage(null)).toBe('Failed to execute transaction')
      expect(getErrorMessage(undefined)).toBe('Failed to execute transaction')
    })
  })
})
