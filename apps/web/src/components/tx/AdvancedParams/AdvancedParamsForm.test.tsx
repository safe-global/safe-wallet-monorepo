import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import AdvancedParamsForm from './AdvancedParamsForm'

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { deployed: true } }),
}))

const FIELD_LABELS = ['Wallet nonce', 'Gas limit', 'Max priority fee (Gwei)', 'Max fee (Gwei)']

const PARAMS = {
  userNonce: 1,
  gasLimit: 21000n,
  maxFeePerGas: safeParseUnits('2'),
  maxPriorityFeePerGas: safeParseUnits('1'),
}

const renderForm = (onSubmit = jest.fn()) =>
  render(<AdvancedParamsForm params={PARAMS} isExecution isEIP1559 onSubmit={onSubmit} />)

const replaceValue = async (label: string, value: string) => {
  const input = screen.getByLabelText(label)
  await userEvent.clear(input)
  await userEvent.type(input, value)
}

describe('AdvancedParamsForm', () => {
  it('submits the edited wallet nonce, gas limit and fees', async () => {
    const onSubmit = jest.fn()
    renderForm(onSubmit)

    await replaceValue('Wallet nonce', '5')
    await replaceValue('Gas limit', '300000')
    await replaceValue('Max priority fee (Gwei)', '1.5')
    await replaceValue('Max fee (Gwei)', '3')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(onSubmit).toHaveBeenCalledWith({
      userNonce: 5,
      gasLimit: 300000n,
      maxPriorityFeePerGas: safeParseUnits('1.5'),
      maxFeePerGas: safeParseUnits('3'),
    })
  })

  it('lets the user edit every field when executing with the connected wallet', () => {
    renderForm()

    for (const label of FIELD_LABELS) {
      expect(screen.getByLabelText(label)).toBeEnabled()
    }
  })
})
