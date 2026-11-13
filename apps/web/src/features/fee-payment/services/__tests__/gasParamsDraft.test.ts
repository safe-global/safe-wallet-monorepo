import {
  fromGasParamsDraft,
  isSameGasParamsDraft,
  toGasParamsDraft,
  validateGasParamsDraft,
  type GasParamsDraft,
} from '../gasParamsDraft'

const GWEI = 1_000_000_000n

const valid: GasParamsDraft = {
  userNonce: '12',
  gasLimit: '79262',
  maxPriorityFeePerGas: '0.05',
  maxFeePerGas: '1.82',
}

describe('gasParamsDraft', () => {
  it('turns the execution parameters into Gwei text and back', () => {
    const params = {
      userNonce: 12,
      gasLimit: 79262n,
      maxPriorityFeePerGas: GWEI / 20n,
      maxFeePerGas: 182n * (GWEI / 100n),
    }

    const draft = toGasParamsDraft(params)

    expect(draft).toEqual(valid)
    expect(fromGasParamsDraft(draft)).toEqual(params)
  })

  it('leaves fields without a value empty', () => {
    expect(toGasParamsDraft({ gasLimit: null })).toEqual({
      userNonce: '',
      gasLimit: '',
      maxPriorityFeePerGas: '',
      maxFeePerGas: '',
    })
  })

  it('accepts a comma as decimal separator', () => {
    expect(fromGasParamsDraft({ ...valid, maxFeePerGas: '1,82' }).maxFeePerGas).toBe(182n * (GWEI / 100n))
  })

  it('has no errors for valid values', () => {
    expect(validateGasParamsDraft(valid, true)).toEqual({})
  })

  it('asks for a gas limit when it is empty', () => {
    expect(validateGasParamsDraft({ ...valid, gasLimit: '' }, true)).toEqual({ gasLimit: 'REQUIRED' })
  })

  it('rejects a gas limit below 21000 or not a whole number', () => {
    expect(validateGasParamsDraft({ ...valid, gasLimit: '20999' }, true)).toEqual({ gasLimit: 'BELOW_MIN_GAS_LIMIT' })
    expect(validateGasParamsDraft({ ...valid, gasLimit: '21000.5' }, true)).toEqual({ gasLimit: 'NOT_INTEGER' })
  })

  it('rejects a nonce that is not a whole number', () => {
    expect(validateGasParamsDraft({ ...valid, userNonce: '1.5' }, true)).toEqual({ userNonce: 'NOT_INTEGER' })
  })

  it('rejects missing or malformed fees', () => {
    expect(validateGasParamsDraft({ ...valid, maxFeePerGas: '' }, true)).toEqual({ maxFeePerGas: 'REQUIRED' })
    expect(validateGasParamsDraft({ ...valid, maxPriorityFeePerGas: 'abc' }, true)).toEqual({
      maxPriorityFeePerGas: 'INVALID_AMOUNT',
    })
  })

  it('rejects a max fee below the priority fee', () => {
    expect(validateGasParamsDraft({ ...valid, maxPriorityFeePerGas: '2' }, true)).toEqual({
      maxFeePerGas: 'BELOW_PRIORITY_FEE',
    })
  })

  it('ignores the priority fee without EIP-1559', () => {
    expect(validateGasParamsDraft({ ...valid, maxPriorityFeePerGas: '' }, false)).toEqual({})
  })

  it('compares drafts field by field', () => {
    expect(isSameGasParamsDraft(valid, { ...valid })).toBe(true)
    expect(isSameGasParamsDraft(valid, { ...valid, gasLimit: '80000' })).toBe(false)
  })
})
