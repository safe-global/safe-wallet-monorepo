import { render } from '@/tests/test-utils'
import { userEvent } from '@testing-library/user-event'
import SingleTxDecoded from '.'
import { Operation } from '@safe-global/store/gateway/types'
import { faker } from '@faker-js/faker'
import { parseUnits } from 'ethers'
import { ERC20__factory } from '@safe-global/utils/types/contracts'

const renderApproveAction = () => {
  const unknownToken = faker.finance.ethereumAddress()
  const spender = faker.finance.ethereumAddress()
  const dataDecoded = {
    method: 'approve',
    parameters: [
      { name: 'spender', type: 'address', value: spender },
      { name: 'value', type: 'uint256', value: '100000' },
    ],
  }

  return render(
    <SingleTxDecoded
      actionTitle="0"
      tx={{
        data: ERC20__factory.createInterface().encodeFunctionData('approve', [spender, '100000']),
        value: '0',
        operation: Operation.CALL,
        to: unknownToken,
        dataDecoded,
      }}
      txData={{
        to: { value: unknownToken },
        operation: Operation.CALL,
        trustedDelegateCallTarget: false,
        addressInfoIndex: {},
        dataDecoded,
      }}
    />,
  )
}

describe('SingleTxDecoded', () => {
  it('should show native transfers', () => {
    const receiver = faker.finance.ethereumAddress()
    const result = render(
      <SingleTxDecoded
        actionTitle="0"
        tx={{
          data: '0x',
          operation: Operation.CALL,
          to: receiver,
          value: parseUnits('1').toString(),
        }}
        txData={{
          to: { value: receiver },
          operation: Operation.CALL,
          trustedDelegateCallTarget: false,
          addressInfoIndex: {},
          value: parseUnits('1').toString(),
        }}
      />,
    )

    expect(result.getByText(`1 ETH`)).not.toBeNull()
  })

  it('should show unknown contract interactions', () => {
    const unknownToken = faker.finance.ethereumAddress()
    const spender = faker.finance.ethereumAddress()
    const result = render(
      <SingleTxDecoded
        actionTitle="0"
        tx={{
          data: ERC20__factory.createInterface().encodeFunctionData('approve', [spender, '100000']),
          value: '0',
          operation: Operation.CALL,
          to: unknownToken,
        }}
        txData={{
          to: { value: unknownToken },
          operation: Operation.CALL,
          trustedDelegateCallTarget: false,
          addressInfoIndex: {},
        }}
      />,
    )

    expect(result.queryByText('contract interaction')).not.toBeNull()
  })

  it('should show decoded data ', () => {
    const unknownToken = faker.finance.ethereumAddress()
    const spender = faker.finance.ethereumAddress()
    const result = render(
      <SingleTxDecoded
        actionTitle="0"
        tx={{
          data: ERC20__factory.createInterface().encodeFunctionData('approve', [spender, '100000']),
          value: '0',
          operation: Operation.CALL,
          to: unknownToken,
          dataDecoded: {
            method: 'approve',
            parameters: [
              {
                name: 'spender',
                type: 'address',
                value: spender,
              },
              {
                name: 'value',
                type: 'uint256',
                value: '100000',
              },
            ],
          },
        }}
        txData={{
          to: { value: unknownToken },
          operation: Operation.CALL,
          trustedDelegateCallTarget: false,
          addressInfoIndex: {},
          dataDecoded: {
            method: 'approve',
            parameters: [
              {
                name: 'spender',
                type: 'address',
                value: spender,
              },
              {
                name: 'value',
                type: 'uint256',
                value: '100000',
              },
            ],
          },
        }}
      />,
    )

    expect(result.queryAllByText('approve')).not.toHaveLength(0)
  })

  it('exposes the action row as a tabbable button', async () => {
    const result = renderApproveAction()

    await userEvent.tab()

    expect(result.getByTestId('action-item')).toHaveFocus()
    expect(result.getByTestId('action-item')).toHaveAttribute('role', 'button')
  })

  it('expands the action on Enter', async () => {
    const result = renderApproveAction()

    result.getByTestId('action-item').focus()
    await userEvent.keyboard('{Enter}')

    expect(result.getByTestId('action-item')).toHaveAttribute('aria-expanded', 'true')
    expect(await result.findByText('spender')).toBeInTheDocument()
  })

  it('expands the action on Space', async () => {
    const result = renderApproveAction()

    result.getByTestId('action-item').focus()
    await userEvent.keyboard('[Space]')

    expect(result.getByTestId('action-item')).toHaveAttribute('aria-expanded', 'true')
    expect(await result.findByText('spender')).toBeInTheDocument()
  })
})
