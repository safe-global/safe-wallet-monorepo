import { parseFeeParams } from './feeParams'

describe('parseFeeParams', () => {
  it('should convert valid string parameters to EstimatedFeeValues', () => {
    const params = {
      maxFeePerGas: '1000000000',
      maxPriorityFeePerGas: '500000000',
      gasLimit: '21000',
      nonce: '5',
    }

    const result = parseFeeParams(params)

    expect(result).toEqual({
      maxFeePerGas: BigInt('1000000000'),
      maxPriorityFeePerGas: BigInt('500000000'),
      gasLimit: BigInt('21000'),
      nonce: 5,
    })
  })

  it('should return null when maxFeePerGas is missing', () => {
    const params = {
      maxPriorityFeePerGas: '500000000',
      gasLimit: '21000',
      nonce: '5',
    }

    const result = parseFeeParams(params)

    expect(result).toBeNull()
  })

  it('should return null when maxPriorityFeePerGas is missing', () => {
    const params = {
      maxFeePerGas: '1000000000',
      gasLimit: '21000',
      nonce: '5',
    }

    const result = parseFeeParams(params)

    expect(result).toBeNull()
  })

  it('should return null when gasLimit is missing', () => {
    const params = {
      maxFeePerGas: '1000000000',
      maxPriorityFeePerGas: '500000000',
      nonce: '5',
    }

    const result = parseFeeParams(params)

    expect(result).toBeNull()
  })

  it('should return null when nonce is missing', () => {
    const params = {
      maxFeePerGas: '1000000000',
      maxPriorityFeePerGas: '500000000',
      gasLimit: '21000',
    }

    const result = parseFeeParams(params)

    expect(result).toBeNull()
  })

  it('should return null when all parameters are missing', () => {
    const params = {}

    const result = parseFeeParams(params)

    expect(result).toBeNull()
  })

  it('should handle large BigInt values correctly', () => {
    const params = {
      maxFeePerGas: '999999999999999999',
      maxPriorityFeePerGas: '888888888888888888',
      gasLimit: '777777777777777777',
      nonce: '999',
    }

    const result = parseFeeParams(params)

    expect(result).toEqual({
      maxFeePerGas: BigInt('999999999999999999'),
      maxPriorityFeePerGas: BigInt('888888888888888888'),
      gasLimit: BigInt('777777777777777777'),
      nonce: 999,
    })
  })

  it('should handle zero values correctly', () => {
    const params = {
      maxFeePerGas: '0',
      maxPriorityFeePerGas: '0',
      gasLimit: '0',
      nonce: '0',
    }

    const result = parseFeeParams(params)

    expect(result).toEqual({
      maxFeePerGas: BigInt('0'),
      maxPriorityFeePerGas: BigInt('0'),
      gasLimit: BigInt('0'),
      nonce: 0,
    })
  })
})
