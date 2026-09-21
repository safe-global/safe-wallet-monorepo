import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm } from 'react-hook-form'
import GasLimitInput from './GasLimitInput'

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { deployed: true } }),
}))

const RECOMMENDED_GAS_LIMIT = '21000'
const RESET_LABEL = 'Reset to recommended gas limit'

const TestForm = ({ recommendedGasLimit }: { recommendedGasLimit?: string }) => {
  const formMethods = useForm({
    mode: 'onChange',
    defaultValues: { gasLimit: RECOMMENDED_GAS_LIMIT },
  })
  return (
    <FormProvider {...formMethods}>
      <GasLimitInput recommendedGasLimit={recommendedGasLimit} />
    </FormProvider>
  )
}

describe('GasLimitInput', () => {
  it('only shows the reset button when the value differs from the recommended gas limit', async () => {
    render(<TestForm recommendedGasLimit={RECOMMENDED_GAS_LIMIT} />)

    expect(screen.queryByLabelText(RESET_LABEL)).not.toBeInTheDocument()

    const input = screen.getByLabelText<HTMLInputElement>('Gas limit')
    await userEvent.type(input, '9')

    expect(input).toHaveValue('210009')
    expect(screen.getByLabelText(RESET_LABEL)).toBeInTheDocument()

    await userEvent.click(screen.getByLabelText(RESET_LABEL))

    expect(input).toHaveValue(RECOMMENDED_GAS_LIMIT)
    expect(screen.queryByLabelText(RESET_LABEL)).not.toBeInTheDocument()
  })

  it('keeps the same input element (and focus) when the reset button appears', async () => {
    render(<TestForm recommendedGasLimit={RECOMMENDED_GAS_LIMIT} />)

    const input = screen.getByLabelText<HTMLInputElement>('Gas limit')
    await userEvent.type(input, '9')

    // Diverging from the recommended value mounts the reset adornment; the input itself
    // must not be remounted, otherwise the user loses focus mid-typing.
    expect(screen.getByLabelText('Gas limit')).toBe(input)
    expect(input).toHaveFocus()
  })

  it('never shows the reset button without a recommended gas limit', async () => {
    render(<TestForm />)

    const input = screen.getByLabelText<HTMLInputElement>('Gas limit')
    await userEvent.type(input, '9')

    expect(screen.queryByLabelText(RESET_LABEL)).not.toBeInTheDocument()
  })
})
