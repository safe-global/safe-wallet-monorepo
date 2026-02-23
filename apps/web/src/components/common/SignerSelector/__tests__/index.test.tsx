import { render, fireEvent } from '@/tests/test-utils'
import SignerSelector from '..'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'

describe('SignerSelector', () => {
  const address1 = checksumAddress(faker.finance.ethereumAddress())
  const address2 = checksumAddress(faker.finance.ethereumAddress())
  const address3 = checksumAddress(faker.finance.ethereumAddress())

  it('should render a select with the provided options', () => {
    const result = render(<SignerSelector options={[address1, address2]} value={address1} onChange={jest.fn()} />)

    // The select should show the selected value
    expect(result.container.querySelector('[role="combobox"]')).toBeInTheDocument()
  })

  it('should render with a custom label', () => {
    const result = render(
      <SignerSelector options={[address1, address2]} value={address1} onChange={jest.fn()} label="Delegator account" />,
    )

    expect(result.getByLabelText('Delegator account')).toBeInTheDocument()
  })

  it('should render with default label when not specified', () => {
    const result = render(<SignerSelector options={[address1, address2]} value={address1} onChange={jest.fn()} />)

    expect(result.getByLabelText('Signer account')).toBeInTheDocument()
  })

  it('should call onChange when a different option is selected', () => {
    const onChange = jest.fn()
    const result = render(<SignerSelector options={[address1, address2]} value={address1} onChange={onChange} />)

    // Open the select dropdown
    const select = result.container.querySelector('[role="combobox"]')!
    fireEvent.mouseDown(select)

    // Click the second option
    const options = result.getAllByRole('option')
    fireEvent.click(options[1])

    expect(onChange).toHaveBeenCalledWith(address2)
  })

  it('should show disabled pill for disabled options', () => {
    const result = render(
      <SignerSelector
        options={[address1, address2]}
        value={address1}
        onChange={jest.fn()}
        isOptionDisabled={(addr) => addr === address2}
        disabledReason={() => 'Already signed'}
      />,
    )

    // Open the select
    const select = result.container.querySelector('[role="combobox"]')!
    fireEvent.mouseDown(select)

    // The disabled option should be present
    const options = result.getAllByRole('option')
    expect(options[1]).toHaveAttribute('aria-disabled', 'true')
  })

  it('should render all three options', () => {
    const result = render(
      <SignerSelector options={[address1, address2, address3]} value={address1} onChange={jest.fn()} />,
    )

    // Open the select
    const select = result.container.querySelector('[role="combobox"]')!
    fireEvent.mouseDown(select)

    const options = result.getAllByRole('option')
    expect(options).toHaveLength(3)
  })
})
