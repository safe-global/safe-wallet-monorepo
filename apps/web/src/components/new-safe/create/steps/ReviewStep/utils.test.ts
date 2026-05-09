import { ExecutionMethod } from '@/components/tx/ExecutionMethodSelector'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import {
  buildTransactionOptions,
  getDeploymentType,
  getNetworkLabel,
  getPaymentMethodLabel,
  getThresholdLabel,
  getWillRelay,
  shouldShowNetworkWarning,
} from './utils'

describe('getNetworkLabel', () => {
  it('returns "Network" for a single network', () => {
    expect(getNetworkLabel(1)).toBe('Network')
  })

  it('returns "Networks" for multiple networks', () => {
    expect(getNetworkLabel(2)).toBe('Networks')
    expect(getNetworkLabel(10)).toBe('Networks')
  })
})

describe('getThresholdLabel', () => {
  it('uses "signer" for a single owner', () => {
    expect(getThresholdLabel(1, 1)).toBe('1 out of 1 signer')
  })

  it('uses "signers" for multiple owners', () => {
    expect(getThresholdLabel(2, 3)).toBe('2 out of 3 signers')
  })

  it('handles threshold equal to owner count', () => {
    expect(getThresholdLabel(5, 5)).toBe('5 out of 5 signers')
  })
})

describe('getDeploymentType', () => {
  it('returns "Counterfactual" when counterfactual is enabled and PayLater is chosen', () => {
    expect(getDeploymentType(true, PayMethod.PayLater)).toBe('Counterfactual')
  })

  it('returns "Direct" when counterfactual is enabled but PayNow is chosen', () => {
    expect(getDeploymentType(true, PayMethod.PayNow)).toBe('Direct')
  })

  it('returns "Direct" when counterfactual is disabled regardless of payMethod', () => {
    expect(getDeploymentType(false, PayMethod.PayLater)).toBe('Direct')
    expect(getDeploymentType(false, PayMethod.PayNow)).toBe('Direct')
  })
})

describe('getPaymentMethodLabel', () => {
  it('returns "Pay-later" when counterfactual is enabled and PayLater is chosen', () => {
    expect(getPaymentMethodLabel(true, PayMethod.PayLater, false)).toBe('Pay-later')
    expect(getPaymentMethodLabel(true, PayMethod.PayLater, true)).toBe('Pay-later')
  })

  it('returns "Sponsored" when relay is used and not pay-later', () => {
    expect(getPaymentMethodLabel(true, PayMethod.PayNow, true)).toBe('Sponsored')
    expect(getPaymentMethodLabel(false, PayMethod.PayNow, true)).toBe('Sponsored')
    expect(getPaymentMethodLabel(false, PayMethod.PayLater, true)).toBe('Sponsored')
  })

  it('returns "Self-paid" when not relaying and not pay-later', () => {
    expect(getPaymentMethodLabel(true, PayMethod.PayNow, false)).toBe('Self-paid')
    expect(getPaymentMethodLabel(false, PayMethod.PayNow, false)).toBe('Self-paid')
    expect(getPaymentMethodLabel(false, PayMethod.PayLater, false)).toBe('Self-paid')
  })
})

describe('shouldShowNetworkWarning', () => {
  it('returns true when on wrong chain, PayNow, not relaying, single-chain', () => {
    expect(shouldShowNetworkWarning(true, PayMethod.PayNow, false, false, true)).toBe(true)
  })

  it('returns false when on correct chain', () => {
    expect(shouldShowNetworkWarning(false, PayMethod.PayNow, false, false, true)).toBe(false)
  })

  it('returns false when relaying (fee is waived)', () => {
    expect(shouldShowNetworkWarning(true, PayMethod.PayNow, true, false, true)).toBe(false)
  })

  it('returns false for multi-chain deployment regardless of chain match', () => {
    expect(shouldShowNetworkWarning(true, PayMethod.PayNow, false, true, true)).toBe(false)
  })

  it('returns false for PayLater when counterfactual is enabled', () => {
    expect(shouldShowNetworkWarning(true, PayMethod.PayLater, false, false, true)).toBe(false)
  })

  it('returns true when on wrong chain and counterfactual is disabled, single-chain', () => {
    expect(shouldShowNetworkWarning(true, PayMethod.PayNow, false, false, false)).toBe(true)
  })

  it('returns false when counterfactual is disabled but multi-chain', () => {
    expect(shouldShowNetworkWarning(true, PayMethod.PayNow, false, true, false)).toBe(false)
  })

  it('returns false when on correct chain and counterfactual is disabled', () => {
    expect(shouldShowNetworkWarning(false, PayMethod.PayNow, false, false, false)).toBe(false)
  })
})

describe('buildTransactionOptions', () => {
  const maxFeePerGas = BigInt('100')
  const maxPriorityFeePerGas = BigInt('10')
  const gasLimit = BigInt('21000')

  it('returns EIP-1559 options when isEIP1559 is true', () => {
    const result = buildTransactionOptions(true, maxFeePerGas, maxPriorityFeePerGas, gasLimit)
    expect(result).toEqual({
      maxFeePerGas: '100',
      maxPriorityFeePerGas: '10',
      gasLimit: '21000',
    })
  })

  it('returns legacy options when isEIP1559 is false', () => {
    const result = buildTransactionOptions(false, maxFeePerGas, maxPriorityFeePerGas, gasLimit)
    expect(result).toEqual({
      gasPrice: '100',
      gasLimit: '21000',
    })
  })

  it('handles undefined gas values', () => {
    const result = buildTransactionOptions(true, undefined, undefined, undefined)
    expect(result).toEqual({
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
      gasLimit: undefined,
    })
  })

  it('handles undefined values for legacy options', () => {
    const result = buildTransactionOptions(false, undefined, undefined, undefined)
    expect(result).toEqual({
      gasPrice: undefined,
      gasLimit: undefined,
    })
  })
})

describe('getWillRelay', () => {
  it('returns true when canRelay is true and executionMethod is RELAY', () => {
    expect(getWillRelay(true, ExecutionMethod.RELAY)).toBe(true)
  })

  it('returns false when canRelay is false', () => {
    expect(getWillRelay(false, ExecutionMethod.RELAY)).toBe(false)
  })

  it('returns false when executionMethod is not RELAY', () => {
    expect(getWillRelay(true, ExecutionMethod.WALLET)).toBe(false)
  })

  it('returns false when both canRelay is false and method is not RELAY', () => {
    expect(getWillRelay(false, ExecutionMethod.WALLET)).toBe(false)
  })
})
