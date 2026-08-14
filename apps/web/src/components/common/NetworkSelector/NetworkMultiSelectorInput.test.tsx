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

  const renderInput = (onNetworkChange?: (networks: Chain[]) => void, showSelectAll?: boolean) =>
    render(
      <Form>
        <NetworkMultiSelectorInput
          name="networks"
          value={[]}
          onNetworkChange={onNetworkChange}
          showSelectAll={showSelectAll}
        />
      </Form>,
    )

  it('opens the listbox on input click and closes it on an outside press', () => {
    renderInput()

    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // base-ui's Popover dismisses on an outside press; fire the full sequence so it triggers
    // regardless of the resolved `outsidePressEvent` mode.
    fireEvent.pointerDown(document.body)
    fireEvent.mouseDown(document.body)
    fireEvent.click(document.body)
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

  it('opens the listbox and highlights the first option on ArrowDown', () => {
    renderInput()
    const input = screen.getByRole('combobox')

    fireEvent.keyDown(input, { key: 'ArrowDown' })

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('data-active')
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
  })

  it('moves the highlight with arrow keys and selects the highlighted option with Enter', () => {
    const onNetworkChange = jest.fn()
    renderInput(onNetworkChange)
    const input = screen.getByRole('combobox')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    const options = screen.getAllByRole('option')
    expect(options[1]).toHaveAttribute('data-active')
    expect(input).toHaveAttribute('aria-activedescendant', options[1].id)

    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onNetworkChange).toHaveBeenCalledWith([expect.objectContaining({ chainId: '11155111' })])
  })

  it('wraps the highlight from the first option to the last on ArrowUp', () => {
    renderInput()
    const input = screen.getByRole('combobox')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })

    const options = screen.getAllByRole('option')
    expect(options[options.length - 1]).toHaveAttribute('data-active')
  })

  it('does not select anything on Enter before an option is highlighted', () => {
    const onNetworkChange = jest.fn()
    renderInput(onNetworkChange)
    const input = screen.getByRole('combobox')

    fireEvent.click(input)
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onNetworkChange).not.toHaveBeenCalled()
  })

  it('prevents the default Enter action (form submission) while the listbox is open', () => {
    renderInput()
    const input = screen.getByRole('combobox')

    fireEvent.click(input)
    const notPrevented = fireEvent.keyDown(input, { key: 'Enter' })

    expect(notPrevented).toBe(false)
  })

  it('leaves the default Enter action intact while the listbox is closed', () => {
    renderInput()
    const input = screen.getByRole('combobox')

    const notPrevented = fireEvent.keyDown(input, { key: 'Enter' })

    expect(notPrevented).toBe(true)
  })

  it('skips the Select All option in keyboard navigation while a filter is typed', () => {
    const onNetworkChange = jest.fn()
    renderInput(onNetworkChange, true)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'sep' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('Select All')
    expect(options[0]).not.toHaveAttribute('data-active')
    expect(options[1]).toHaveAttribute('data-active')

    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onNetworkChange).toHaveBeenCalledWith([expect.objectContaining({ chainId: '11155111' })])
  })

  it('still reaches the Select All option with arrow keys when no filter is typed', () => {
    const onNetworkChange = jest.fn()
    renderInput(onNetworkChange, true)
    const input = screen.getByRole('combobox')

    fireEvent.keyDown(input, { key: 'ArrowDown' })

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('Select All')
    expect(options[0]).toHaveAttribute('data-active')

    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onNetworkChange).toHaveBeenCalledWith([
      expect.objectContaining({ chainId: '1' }),
      expect.objectContaining({ chainId: '11155111' }),
    ])
  })

  it('resets the highlight when the search text changes', () => {
    renderInput()
    const input = screen.getByRole('combobox')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.change(input, { target: { value: 'sep' } })

    expect(input).not.toHaveAttribute('aria-activedescendant')
    expect(screen.getAllByRole('option').some((option) => option.hasAttribute('data-active'))).toBe(false)
  })
})
