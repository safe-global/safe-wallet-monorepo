import { fireEvent, renderWithUserEvent, screen } from '@/tests/test-utils'
import type { TokenOption } from '../../../SpendingLimitFlow/utils/tokenOptions'
import TokenDraftRow from '../TokenDraftRow'

const option = (address: string, symbol: string, name: string): TokenOption => ({
  address,
  symbol,
  name,
  decimals: 18,
  group: 'popular',
})

const DAI = option('0x00000000000000000000000000000000000000b2', 'DAI', 'Dai Stablecoin')
const LINK = option('0x00000000000000000000000000000000000000c3', 'LINK', 'Chainlink')

const setup = () => {
  const onConfirm = jest.fn()
  const onCancel = jest.fn()
  const result = renderWithUserEvent(<TokenDraftRow options={[DAI, LINK]} onConfirm={onConfirm} onCancel={onCancel} />)
  return { ...result, onConfirm, onCancel }
}

describe('TokenDraftRow', () => {
  it('opens with the tokens listed under their group', () => {
    setup()

    expect(screen.getByText('Popular')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /DAI/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /LINK/ })).toBeInTheDocument()
  })

  it('adds the token picked from the list', async () => {
    const { user, onConfirm } = setup()

    await user.click(screen.getByRole('option', { name: /LINK/ }))

    expect(onConfirm).toHaveBeenCalledWith(LINK.address)
  })

  it('adds the first token the typed text matches with the check button', async () => {
    const { user, onConfirm } = setup()

    await user.type(screen.getByRole('combobox', { name: 'Token' }), 'chain')
    // user-event's click does not reach this button while the list is open; a browser click does
    fireEvent.click(screen.getByRole('button', { name: 'Add token' }))

    expect(onConfirm).toHaveBeenCalledWith(LINK.address)
  })

  it('keeps the check button off when nothing matches', async () => {
    const { user } = setup()

    await user.type(screen.getByRole('combobox', { name: 'Token' }), 'nothing')

    expect(screen.getByRole('button', { name: 'Add token' })).toBeDisabled()
  })

  it('drops the row when closed before anything is typed', async () => {
    const { user, onCancel } = setup()

    await user.keyboard('{Escape}')

    expect(onCancel).toHaveBeenCalled()
  })

  it('keeps the row once something is typed, until it is cancelled', async () => {
    const { user, onCancel } = setup()

    await user.type(screen.getByRole('combobox', { name: 'Token' }), 'nothing')
    expect(onCancel).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel adding a token' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
