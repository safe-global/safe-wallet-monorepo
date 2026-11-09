import type { FeePayerView, GasPayerChoice, NetworkFee } from '@safe-global/views/features/fee-payment/types'
import type { GasFeeDetailsProps } from '@safe-global/views/features/fee-payment/components/GasFeeDetails'
import { ETH_TOKEN, ETH_USD, type Scenario } from '../sampleData'
import type { GasParamName, GasParamsState } from './useGasParams'

const GWEI = 1e-9

const toFee = (gasLimit: string, gweiPerGas: string): NetworkFee => {
  const eth = Number(gasLimit) * Number(gweiPerGas) * GWEI
  return {
    amount: eth < 0.00001 ? '< 0.00001' : eth.toFixed(5),
    currency: 'ETH',
    fiatAmount: `$${(eth * ETH_USD).toFixed(2)}`,
  }
}

const FIELD_LABELS: Record<GasParamName, string> = {
  userNonce: 'Wallet nonce',
  gasLimit: 'Gas limit',
  maxPriorityFeeGwei: 'Max priority fee (Gwei)',
  maxFeeGwei: 'Max fee (Gwei)',
}

const READ_ONLY_NOTE: Partial<Record<GasPayerChoice, string>> = {
  PAY_FROM_SAFE: 'Set by the relayer quote at signing. Paid from the Safe, so it cannot be edited.',
  SPONSORED: 'Covered by your Pro plan. The relayer sets the gas.',
}

/** Turns the payer and gas settings into the finished values the Fees card shows. */
export const useFeesView = (
  scenario: Scenario,
  choice: GasPayerChoice,
  gas: GasParamsState,
): { view: FeePayerView; gasFeeDetails: GasFeeDetailsProps } => {
  const paysFromSafe = choice === 'PAY_FROM_SAFE'
  const walletFee: NetworkFee = gas.saved ? toFee(gas.saved.gasLimit, gas.saved.maxFeeGwei) : { error: true }
  const gasFee = paysFromSafe ? toFee(scenario.safeQuote.gasLimit, scenario.safeQuote.gasPriceGwei) : walletFee

  const view: FeePayerView = {
    payer: scenario.payer.kind === 'choice' ? { ...scenario.payer, value: choice } : scenario.payer,
    gasToken: { tokens: [ETH_TOKEN], selected: ETH_TOKEN.address, locked: true },
    executionFee: {},
    gasFee,
    sponsored: choice === 'SPONSORED',
    sponsorKind: scenario.sponsorKind,
    footer: scenario.footer,
  }

  const rows = paysFromSafe
    ? [
        { label: 'Gas limit', value: scenario.safeQuote.gasLimit },
        { label: 'Gas price (Gwei)', value: scenario.safeQuote.gasPriceGwei },
        { label: 'Refund to', value: 'Safe relayer' },
      ]
    : (Object.keys(FIELD_LABELS) as GasParamName[])
        .filter((name) => choice === 'WALLET' || name !== 'userNonce')
        .map((name) => ({
          label: gas.isEdited && name !== 'userNonce' ? `${FIELD_LABELS[name]} · edited` : FIELD_LABELS[name],
          value: gas.saved?.[name] || 'Cannot estimate',
        }))

  const editor =
    choice === 'WALLET' && gas.draft
      ? {
          fields: (Object.keys(FIELD_LABELS) as GasParamName[]).map((name) => ({
            name,
            label: FIELD_LABELS[name],
            value: gas.draft?.[name] ?? '',
            error: gas.errors[name],
            onChange: (value: string) => gas.change(name, value),
          })),
          canSave: Object.keys(gas.errors).length === 0,
          onSave: gas.save,
          onCancel: gas.cancelEditing,
          onReset: gas.estimate && JSON.stringify(gas.draft) !== JSON.stringify(gas.estimate) ? gas.reset : undefined,
        }
      : undefined

  return {
    view,
    gasFeeDetails: { rows, readOnlyNote: READ_ONLY_NOTE[choice], onEdit: gas.startEditing, editor },
  }
}
