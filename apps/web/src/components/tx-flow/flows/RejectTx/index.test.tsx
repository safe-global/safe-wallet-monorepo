import { faker } from '@faker-js/faker'
import { render } from '@/tests/test-utils'
import { TxFlow } from '../../TxFlow'
import RejectTxFlow from '.'

jest.mock('../../TxFlow', () => ({ TxFlow: jest.fn(() => null) }))

const txFlowProps = () => jest.mocked(TxFlow).mock.lastCall?.[0]

describe('RejectTxFlow', () => {
  it('opens an on-chain rejection for the nonce that cannot be added to a batch', () => {
    const txNonce = faker.number.int({ max: 100 })

    render(<RejectTxFlow txNonce={txNonce} />)

    expect(txFlowProps()).toMatchObject({ txNonce, isRejection: true, isBatchable: false })
  })
})
