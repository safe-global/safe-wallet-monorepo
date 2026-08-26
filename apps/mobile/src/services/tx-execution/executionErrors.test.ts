import { CONTRACT_ERROR_FALLBACK, getContractErrorMessage } from '@safe-global/utils/services/exceptions/contractErrors'
import { RelaySimulationError } from '@safe-global/utils/services/relayErrors'
import { ExecutionError, classifyExecutionError, getInsufficientFeeFundsMessage } from './executionErrors'

/**
 * The multi-line viem dump users reported on `/review-and-execute` (WA-2297).
 * Kept verbatim so the "nothing technical leaks" assertions run against the
 * real shape, `cause` chain included.
 */
const makeViemRevertError = (gsCode: string) => {
  const revert = Object.assign(new Error(`Execution reverted with reason: ${gsCode}.`), {
    name: 'ContractFunctionRevertedError',
    reason: gsCode,
  })
  return Object.assign(
    new Error(
      [
        `The contract function "execTransaction" reverted with the following reason:`,
        gsCode,
        '',
        'Contract Call:',
        '  address:   0x94Bb1a1d1b0dEE1F0e3d1234567890abcdef1234',
        '  function:  execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures)',
        '  args:            (0x94Bb1a1d1b0dEE1F0e3d1234567890abcdef1234, 0, 0xeb37acfc, 0, 0, 0, 0, 0x0, 0x0, 0xdeadbeef)',
        '',
        'Version: viem@2.21.54',
      ].join('\n'),
    ),
    {
      name: 'ContractFunctionExecutionError',
      shortMessage: `The contract function "execTransaction" reverted with the following reason: ${gsCode}`,
      cause: revert,
    },
  )
}

const TECHNICAL_LEAKS: [string, RegExp][] = [
  ['error class name', /ContractFunction\w*Error/],
  ['function signature', /execTransaction/],
  ['args dump', /args:/],
  ['hex blob', /0x[0-9a-f]{4,}/i],
  ['library name and version', /\b(viem|ethers|sdk)\b/i],
  ['GS code', /GS\d{3}/],
  ['RPC method', /eth_[a-z]/i],
]

const expectNoTechnicalContent = (message: string) => {
  for (const [, pattern] of TECHNICAL_LEAKS) {
    expect(message).not.toMatch(pattern)
  }
  expect(message).not.toMatch(/\bplease\b/i)
  expect(message).not.toContain('!')
}

describe('classifyExecutionError', () => {
  describe('Safe contract reverts', () => {
    it('classifies a GS013 revert without leaking the raw dump', () => {
      const result = classifyExecutionError(makeViemRevertError('GS013'))

      expect(result).toBeInstanceOf(ExecutionError)
      expect(result?.message).toBe(getContractErrorMessage('GS013'))
      expectNoTechnicalContent(result?.message ?? '')
    })

    it('classifies a GS026 revert without leaking the raw dump', () => {
      const result = classifyExecutionError(makeViemRevertError('GS026'))

      expect(result?.message).toBe(getContractErrorMessage('GS026'))
      expectNoTechnicalContent(result?.message ?? '')
    })

    it('classifies the ethers wording seen in Datadog', () => {
      const result = classifyExecutionError(new Error('execution reverted: GS026 (action="estimateGas")'))

      expect(result?.message).toBe(getContractErrorMessage('GS026'))
    })

    it('reads a GS code nested on a cause', () => {
      const result = classifyExecutionError({
        message: 'Transaction failed',
        cause: { shortMessage: 'reverted with reason GS010' },
      })

      expect(result?.message).toBe(getContractErrorMessage('GS010'))
    })

    it('resolves the native asset placeholder for GS011', () => {
      const result = classifyExecutionError(makeViemRevertError('GS011'), { nativeAsset: 'ETH' })

      expect(result?.message).toBe('Not enough ETH in this Safe Account to cover the network fee.')
    })

    it('falls back rather than leaking an unresolved placeholder', () => {
      // GS012 needs a token symbol we do not have at the point of failure.
      const result = classifyExecutionError(makeViemRevertError('GS012'), { nativeAsset: 'ETH' })

      expect(result?.message).toBe(CONTRACT_ERROR_FALLBACK)
      expect(result?.message).not.toMatch(/\{\w+\}/)
    })

    it('keeps the original throwable on cause for logging', () => {
      const original = makeViemRevertError('GS013')

      expect(classifyExecutionError(original)?.cause).toBe(original)
    })
  })

  describe('insufficient funds for gas', () => {
    it('classifies viem’s total-cost message', () => {
      const error = Object.assign(new Error('Execution reverted'), {
        name: 'TransactionExecutionError',
        cause: {
          name: 'InsufficientFundsError',
          shortMessage:
            'The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account.',
        },
      })

      const result = classifyExecutionError(error, { nativeAsset: 'ETH' })

      expect(result?.message).toBe(getInsufficientFeeFundsMessage('ETH'))
      expect(result?.message).toBe(
        'Not enough ETH in your signer wallet to cover the network fee. Add funds and try again.',
      )
      expectNoTechnicalContent(result?.message ?? '')
    })

    it('classifies the ethers wording', () => {
      const result = classifyExecutionError(new Error('insufficient funds for gas * price + value'))

      expect(result?.message).toBe(getInsufficientFeeFundsMessage())
    })

    it('takes precedence over an unrelated revert marker', () => {
      const result = classifyExecutionError(
        new Error('execution reverted\ntotal cost (gas * gas fee + value) exceeds balance'),
        { nativeAsset: 'MATIC' },
      )

      expect(result?.message).toBe(getInsufficientFeeFundsMessage('MATIC'))
    })
  })

  describe('unknown reverts', () => {
    it('falls back cleanly for a revert with no known GS code', () => {
      const result = classifyExecutionError(makeViemRevertError('GS999'))

      expect(result?.message).toBe(CONTRACT_ERROR_FALLBACK)
      expectNoTechnicalContent(result?.message ?? '')
    })

    it('falls back cleanly for a bare CALL_EXCEPTION', () => {
      const result = classifyExecutionError({ code: 'CALL_EXCEPTION', message: 'missing revert data' })

      expect(result?.message).toBe(CONTRACT_ERROR_FALLBACK)
    })
  })

  describe('errors it must leave alone', () => {
    it('returns undefined for an app-level error', () => {
      expect(classifyExecutionError(new Error('Private key not found'))).toBeUndefined()
    })

    it('returns undefined for an empty throwable', () => {
      expect(classifyExecutionError(undefined)).toBeUndefined()
      expect(classifyExecutionError(null)).toBeUndefined()
      expect(classifyExecutionError({})).toBeUndefined()
    })

    it('returns undefined for a relay simulation error so the caller can branch on it', () => {
      const error = new RelaySimulationError('INDETERMINATE_SIMULATION', 'Simulation could not be completed')

      expect(classifyExecutionError(error)).toBeUndefined()
    })

    it('passes an already user-facing ExecutionError through unchanged', () => {
      const error = new ExecutionError('This transaction needs more confirmations before it can be executed.')

      expect(classifyExecutionError(error)).toBe(error)
    })
  })
})
