import userEvent from '@testing-library/user-event'
import { render, screen } from '@/tests/test-utils'
import AccountItemCheckbox from '../AccountItemCheckbox'

const ADDRESS = '0x0000000000000000000000000000000000000001'

describe('AccountItemCheckbox', () => {
  it('toggles exactly once per checkbox click without triggering the surrounding row', async () => {
    const onCheckedChange = jest.fn()
    const onRowClick = jest.fn()

    render(
      <div role="button" onClick={onRowClick}>
        <AccountItemCheckbox checked={false} address={ADDRESS} onCheckedChange={onCheckedChange} />
      </div>,
    )

    await userEvent.click(screen.getByTestId(`safe-item-checkbox-${ADDRESS}`))

    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(onCheckedChange.mock.calls[0][0]).toBe(true)
    // The Base UI checkbox emits two bubbling clicks (button + re-dispatched hidden input);
    // neither may reach the row or a row-level toggle would fire twice and cancel out.
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('leaves clicks outside the checkbox to the surrounding row', async () => {
    const onCheckedChange = jest.fn()
    const onRowClick = jest.fn()

    render(
      <div role="button" onClick={onRowClick}>
        <span>row content</span>
        <AccountItemCheckbox checked={false} address={ADDRESS} onCheckedChange={onCheckedChange} />
      </div>,
    )

    await userEvent.click(screen.getByText('row content'))

    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})
