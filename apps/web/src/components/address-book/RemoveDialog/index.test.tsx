import { faker } from '@faker-js/faker'
import { fakerChecksummedAddress, renderWithUserEvent, screen } from '@/tests/test-utils'
import { mockChainId } from '@/tests/mocks/hooks'
import { getStoreInstance } from '@/store'
import RemoveDialog from '.'

jest.mock('@/hooks/useChainId')

const CHAIN_ID = '11155111'

describe('RemoveDialog', () => {
  beforeEach(() => {
    mockChainId(CHAIN_ID)
  })

  it('deletes the entry from the address book of the current chain', async () => {
    const removed = fakerChecksummedAddress()
    const kept = fakerChecksummedAddress()
    const [removedName, keptName] = [faker.person.firstName(), faker.person.lastName()]
    const onClose = jest.fn()
    const { user } = renderWithUserEvent(<RemoveDialog address={removed} handleClose={onClose} />, {
      initialReduxState: { addressBook: { [CHAIN_ID]: { [removed]: removedName, [kept]: keptName } } },
    })

    expect(screen.getByText(removedName)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(getStoreInstance().getState().addressBook[CHAIN_ID]).toEqual({ [kept]: keptName })
    expect(onClose).toHaveBeenCalled()
  })
})
