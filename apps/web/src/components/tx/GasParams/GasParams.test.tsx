import { render } from '@/tests/test-utils'
import { _GasParams as GasParams } from '@/components/tx/GasParams/index'
import type { AdvancedParameters } from '@/components/tx/AdvancedParams'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

describe('GasParams', () => {
  it('Shows the estimated fee on execution', () => {
    const params: AdvancedParameters = {
      gasLimit: BigInt('21000'),
      nonce: 0,
      userNonce: 1,
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('10000'),
    }

    const { getByText } = render(<GasParams params={params} isExecution={true} isEIP1559={true} onEdit={jest.fn} />)

    expect(getByText('Estimated fee')).toBeInTheDocument()
  })

  it('Shows the nonce when signing and if it exists', () => {
    const params: AdvancedParameters = {
      gasLimit: BigInt('21000'),
      nonce: 0,
      userNonce: 1,
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('10000'),
    }

    const { getByText } = render(<GasParams params={params} isExecution={false} isEIP1559={true} onEdit={jest.fn} />)

    expect(getByText('Signing the transaction with nonce 0')).toBeInTheDocument()
  })

  it("Doesn't show the nonce if it doesn't exist", () => {
    const params: AdvancedParameters = {
      gasLimit: BigInt('21000'),
      userNonce: 1,
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('10000'),
    }

    const { getByText } = render(<GasParams params={params} isExecution={false} isEIP1559={true} onEdit={jest.fn} />)

    expect(getByText('Signing the transaction with nonce')).toBeInTheDocument()
  })

  it('Shows an estimated fee if there is no gasLimit error', () => {
    const params: AdvancedParameters = {
      gasLimit: BigInt('21000'),
      userNonce: 1,
      maxFeePerGas: BigInt('20000'),
      maxPriorityFeePerGas: BigInt('10000'),
    }

    const chainInfo = {
      nativeCurrency: {
        symbol: 'SepoliaETH',
        decimals: 9,
      },
    } as unknown as Chain

    const { getByText } = render(
      <GasParams params={params} isExecution={true} isEIP1559={true} onEdit={jest.fn} chain={chainInfo} />,
    )

    expect(getByText('Estimated fee')).toBeInTheDocument()
    expect(getByText('0.42 SepoliaETH')).toBeInTheDocument()
  })

  it("Doesn't show an estimated fee if there is no gasLimit", () => {
    const params: AdvancedParameters = {
      userNonce: 1,
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('10000'),
    }

    const { getByText, queryByText } = render(
      <GasParams params={params} isExecution={true} isEIP1559={true} onEdit={jest.fn} />,
    )

    expect(getByText('Estimated fee')).toBeInTheDocument()
    expect(queryByText('0.21')).not.toBeInTheDocument()
  })

  it('Shows the nonce if it exists', () => {
    const params: AdvancedParameters = {
      nonce: 123,
      userNonce: 1,
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('10000'),
    }

    const { getByText } = render(<GasParams params={params} isExecution={true} isEIP1559={true} onEdit={jest.fn} />)

    expect(getByText('Safe Account transaction nonce')).toBeInTheDocument()
    expect(getByText('123')).toBeInTheDocument()
  })

  it('Shows safeTxGas if it exists', () => {
    const params: AdvancedParameters = {
      nonce: 123,
      userNonce: 1,
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('10000'),
      safeTxGas: 100,
    }

    const { getByText } = render(<GasParams params={params} isExecution={true} isEIP1559={true} onEdit={jest.fn} />)

    expect(getByText('safeTxGas')).toBeInTheDocument()
    expect(getByText('100')).toBeInTheDocument()
  })

  it('Shows gasLimit if it exists', () => {
    const params: AdvancedParameters = {
      nonce: 123,
      userNonce: 1,
      gasLimit: BigInt('30000'),
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('10000'),
    }

    const { getByText } = render(<GasParams params={params} isExecution={true} isEIP1559={true} onEdit={jest.fn} />)

    expect(getByText('Gas limit')).toBeInTheDocument()
    expect(getByText('30000')).toBeInTheDocument()
  })

  it('Shows a cannot estimate message if there is no gasLimit', () => {
    const params: AdvancedParameters = {
      nonce: 123,
      userNonce: 1,
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('10000'),
    }

    const { queryAllByText } = render(
      <GasParams
        params={params}
        isExecution={true}
        isEIP1559={true}
        onEdit={jest.fn}
        gasLimitError={new Error('Error estimating gas')}
      />,
    )

    expect(queryAllByText('Cannot estimate').length).toBeGreaterThan(0)
  })

  it('Shows maxFee and maxPrioFee if EIP1559', () => {
    const params: AdvancedParameters = {
      nonce: 123,
      userNonce: 1,
      gasLimit: BigInt('30000'),
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('20000'),
    }

    const { getByText } = render(<GasParams params={params} isExecution={true} isEIP1559={true} onEdit={jest.fn} />)

    expect(getByText('Max priority fee (Gwei)')).toBeInTheDocument()
    expect(getByText('0.00002')).toBeInTheDocument()

    expect(getByText('Max fee (Gwei)')).toBeInTheDocument()
    expect(getByText('0.00001')).toBeInTheDocument()
  })

  it('Shows Gas price if not EIP1559', () => {
    const params: AdvancedParameters = {
      nonce: 123,
      userNonce: 1,
      gasLimit: BigInt('30000'),
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('20000'),
    }

    const { getByText } = render(<GasParams params={params} isExecution={true} isEIP1559={false} onEdit={jest.fn} />)

    expect(getByText('Gas price (Gwei)')).toBeInTheDocument()
    expect(getByText('0.00001')).toBeInTheDocument()
  })

  it('Show Edit button if there is a gasLimitError', () => {
    const params: AdvancedParameters = {
      nonce: 123,
      userNonce: 1,
      gasLimit: BigInt('30000'),
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('20000'),
    }

    const { getByText } = render(
      <GasParams
        params={params}
        isExecution={true}
        isEIP1559={false}
        onEdit={jest.fn}
        gasLimitError={new Error('Error estimating gas')}
      />,
    )

    expect(getByText('Edit')).toBeInTheDocument()
  })

  it('Show Edit button if its not an execution', () => {
    const params: AdvancedParameters = {
      nonce: 123,
      userNonce: 1,
      gasLimit: BigInt('30000'),
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('20000'),
    }

    const { getByText } = render(<GasParams params={params} isExecution={false} isEIP1559={false} onEdit={jest.fn} />)

    expect(getByText('Edit')).toBeInTheDocument()
  })

  it('Show Edit button if its an execution and loading finished', () => {
    const params: AdvancedParameters = {
      nonce: 123,
      userNonce: 1,
      gasLimit: BigInt('30000'),
      maxFeePerGas: BigInt('10000'),
      maxPriorityFeePerGas: BigInt('20000'),
    }

    const { getByText } = render(<GasParams params={params} isExecution={true} isEIP1559={false} onEdit={jest.fn} />)

    expect(getByText('Edit')).toBeInTheDocument()
  })
})
