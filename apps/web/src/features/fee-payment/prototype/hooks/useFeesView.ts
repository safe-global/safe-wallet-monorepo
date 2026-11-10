import type { FeePayerView, GasPayerChoice, NetworkFee } from '@safe-global/views/features/fee-payment/types'
import type { FeesPageProps } from '@safe-global/views/features/fee-payment/components/FeesPage'
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

/** Turns the payer and gas settings into the finished values the Fees card shows. */
export const useFeesView = (
  scenario: Scenario,
  choice: GasPayerChoice,
  gas: GasParamsState,
): Pick<FeesPageProps, 'view' | 'gasFeeEditor'> => {
  const paysFromSafe = choice === 'PAY_FROM_SAFE'
  const walletFee: NetworkFee = gas.saved.gasLimit ? toFee(gas.saved.gasLimit, gas.saved.maxFeeGwei) : { error: true }
  const draft = gas.draft

  const view: FeePayerView = {
    payer: scenario.payer.kind === 'choice' ? { ...scenario.payer, value: choice } : scenario.payer,
    gasToken: { tokens: [ETH_TOKEN], selected: ETH_TOKEN.address, locked: true },
    executionFee: {},
    gasFee: paysFromSafe ? toFee(scenario.safeQuote.gasLimit, scenario.safeQuote.gasPriceGwei) : walletFee,
    sponsored: choice === 'SPONSORED',
    sponsorKind: scenario.sponsorKind,
    footer: scenario.footer,
  }

  if (choice !== 'WALLET') return { view }

  return {
    view,
    gasFeeEditor: {
      open: draft !== null,
      onOpenChange: (open) => (open ? gas.startEditing() : gas.cancelEditing()),
      fields: (Object.keys(FIELD_LABELS) as GasParamName[]).map((name) => ({
        name,
        label: FIELD_LABELS[name],
        value: draft?.[name] ?? '',
        error: gas.errors[name],
        autoFocus: name === 'gasLimit' && !gas.estimate.gasLimit,
        onChange: (value: string) => gas.change(name, value),
      })),
      canSave: Object.keys(gas.errors).length === 0,
      onSave: gas.save,
      onCancel: gas.cancelEditing,
      onReset: gas.estimate.gasLimit && JSON.stringify(draft) !== JSON.stringify(gas.estimate) ? gas.reset : undefined,
    },
  }
}
