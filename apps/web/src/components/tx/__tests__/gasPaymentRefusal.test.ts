import { QuotaExceededError } from '@safe-global/utils/services/quotaErrors'
import {
  GasPaymentOptionUnavailableError,
  RelayLimitReachedError,
  RelayerUnavailableError,
} from '@safe-global/utils/services/gasPaymentErrors'
import type { GasPayer } from '@/utils/gasPayment'
import { getGasPaymentRefusal } from '../gasPaymentRefusal'
import { sponsoredQuotaMessage } from '../sponsoredQuotaMessage'

const UNAVAILABLE =
  "This gas payment option isn't available for this Safe account right now. Choose another gas payment method and execute again."
const WALLET_ONLY = 'This transaction can only be executed with your connected wallet. Execute again to continue.'
const LIMIT_REACHED = 'No sponsored transactions left. Choose another gas payment method and execute again.'

const quotaError = new QuotaExceededError('sponsored_transactions', 50, 50, '2026-11-01T00:00:00.000Z', 'x')

describe('getGasPaymentRefusal', () => {
  it.each<[string, Error, GasPayer, ReturnType<typeof getGasPaymentRefusal>]>([
    [
      'a 402 on the subscription',
      quotaError,
      'SUBSCRIPTION',
      { excluded: ['SUBSCRIPTION'], message: sponsoredQuotaMessage(quotaError) },
    ],
    [
      'a 429 on the daily limit',
      new RelayLimitReachedError('x'),
      'FREE_DAILY_LIMIT',
      { excluded: ['FREE_DAILY_LIMIT'], message: LIMIT_REACHED },
    ],
    [
      'a 429 on the campaign',
      new RelayLimitReachedError('x'),
      'NO_FEE_CAMPAIGN',
      { excluded: ['NO_FEE_CAMPAIGN'], message: LIMIT_REACHED },
    ],
    [
      'a 409 for a Safe outside the Workspace',
      new GasPaymentOptionUnavailableError('SUBSCRIPTION', 'NOT_A_WORKSPACE_SAFE', [], 'x'),
      'SUBSCRIPTION',
      { excluded: ['SUBSCRIPTION'], message: UNAVAILABLE },
    ],
    [
      'a 409 for a refund transaction on the chain route',
      new GasPaymentOptionUnavailableError('PAY_FROM_SAFE', 'NOT_LISTED', [], 'x'),
      'FREE_DAILY_LIMIT',
      { excluded: ['NO_FEE_CAMPAIGN', 'FREE_DAILY_LIMIT', 'SUBSCRIPTION'], message: WALLET_ONLY },
    ],
    [
      'a 409 for a refund transaction on the space route',
      new GasPaymentOptionUnavailableError('SUBSCRIPTION', 'REFUNDING_TRANSACTION', [], 'x'),
      'SUBSCRIPTION',
      { excluded: ['NO_FEE_CAMPAIGN', 'FREE_DAILY_LIMIT', 'SUBSCRIPTION'], message: WALLET_ONLY },
    ],
    [
      'a chain-route 403',
      new RelayerUnavailableError('No relayer defined'),
      'FREE_DAILY_LIMIT',
      { excluded: ['FREE_DAILY_LIMIT'], message: UNAVAILABLE },
    ],
    ['any other error', new Error('boom'), 'FREE_DAILY_LIMIT', undefined],
    ['a refusal while paying from the wallet', new RelayLimitReachedError('x'), 'WALLET', undefined],
  ])('handles %s', (_label, err, gasPayer, expected) => {
    expect(getGasPaymentRefusal(err, gasPayer)).toEqual(expected)
  })
})
