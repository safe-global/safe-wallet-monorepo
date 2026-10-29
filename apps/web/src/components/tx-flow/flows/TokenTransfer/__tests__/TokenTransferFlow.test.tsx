import { faker } from '@faker-js/faker'
import { render } from '@/tests/test-utils'
import { TxFlow } from '../../../TxFlow'
import TokenTransferFlow from '..'

jest.mock('../../../TxFlow', () => ({ TxFlow: jest.fn(() => null) }))

const txFlowProps = () => jest.mocked(TxFlow).mock.lastCall?.[0]

describe('TokenTransferFlow', () => {
  it('can be added to a batch when it creates a new transaction', () => {
    render(<TokenTransferFlow />)

    expect(txFlowProps()).toMatchObject({ isBatchable: true })
  })

  it('cannot be added to a batch when it replaces a queued transaction', () => {
    render(<TokenTransferFlow txNonce={faker.number.int({ max: 100 })} />)

    expect(txFlowProps()).toMatchObject({ isBatchable: false })
  })
})
