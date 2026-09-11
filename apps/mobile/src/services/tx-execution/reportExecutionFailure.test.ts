import { DdRum, ErrorSource } from 'expo-datadog'
import { BiometryInvalidationError } from '@/src/services/key-storage/errors'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { PrivateKeyUnavailableError } from './errors'
import { reportExecutionFailure } from './reportExecutionFailure'

describe('reportExecutionFailure', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reports a failure with the shared error taxonomy and execution context', () => {
    const error = new Error('method not supported: eth_sendRawTransaction')

    reportExecutionFailure(error, ExecutionMethod.WITH_PK, '1')

    expect(DdRum.addError).toHaveBeenCalledWith(
      'method not supported: eth_sendRawTransaction',
      ErrorSource.CUSTOM,
      expect.any(String),
      {
        error_domain: 'tx_execution',
        error_type: 'tx_execution_failed',
        error_layer: 'off_chain',
        execution_method: ExecutionMethod.WITH_PK,
        chain_id: '1',
      },
    )
  })

  it('redacts addresses and hex blobs from the message and stack', () => {
    const address = '0x' + 'ab'.repeat(20)
    const error = new Error(`WalletConnect returned an invalid transaction hash: ${address}`)

    reportExecutionFailure(error, ExecutionMethod.WITH_WC, '137')

    const [message, , stack] = (DdRum.addError as jest.Mock).mock.calls[0]
    expect(message).toBe('WalletConnect returned an invalid transaction hash: [redacted]')
    expect(stack).not.toContain(address)
  })

  it('classifies GS revert codes as on-chain reverts', () => {
    reportExecutionFailure(new Error('execution reverted: GS013'), ExecutionMethod.WITH_LEDGER, '1')

    expect(DdRum.addError).toHaveBeenCalledWith(
      expect.any(String),
      ErrorSource.CUSTOM,
      expect.any(String),
      expect.objectContaining({ error_type: 'on_chain_revert', error_layer: 'on_chain' }),
    )
  })

  it.each([
    ['a user rejection', new Error('User rejected the request')],
    ['a cancelled or missing private key', new PrivateKeyUnavailableError()],
    ['an invalidated biometry key', new BiometryInvalidationError(new Error('cause'))],
  ])('does not report %s', (_label, error) => {
    reportExecutionFailure(error, ExecutionMethod.WITH_PK, '1')

    expect(DdRum.addError).not.toHaveBeenCalled()
  })
})
