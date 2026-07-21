import { useForm, FormProvider } from 'react-hook-form'
import type { ReactNode } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { render, screen, fireEvent } from '@/tests/test-utils'
import NetworkMultiSelectorInput from './NetworkMultiSelectorInput'
import useChains from '@/hooks/useChains'

jest.mock('@/hooks/useChains')

const chain = (chainId: string, chainName: string) => ({ chainId, chainName }) as Chain

const Form = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: { networks: [] } })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('NetworkMultiSelectorInput', () => {
  beforeEach(() => {
    ;(useChains as jest.Mock).mockReturnValue({
      configs: [chain('1', 'Ethereum'), chain('11155111', 'Sepolia')],
    })
  })

  const renderInput = () =>
    render(
      <Form>
        <NetworkMultiSelectorInput name="networks" value={[]} />
      </Form>,
    )

  it('opens the listbox on input click and closes it on an outside pointerdown', () => {
    renderInput()

    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('keeps the listbox open on a pointerdown inside the control', () => {
    renderInput()

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.pointerDown(screen.getByRole('combobox'))

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('closes the listbox on Escape', () => {
    renderInput()

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
