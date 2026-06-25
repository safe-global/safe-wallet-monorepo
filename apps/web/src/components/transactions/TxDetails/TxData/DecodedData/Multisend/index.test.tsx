import { fireEvent, render } from '@/tests/test-utils'
import Multisend from '.'
import { Operation } from '@safe-global/store/gateway/types'
import { faker } from '@faker-js/faker'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import useSafeAddress from '@/hooks/useSafeAddress'
import { multiSendDefaultsToSelf } from '@safe-global/utils/utils/multiSend'

jest.mock('@/hooks/useSafeAddress')
jest.mock('@safe-global/utils/utils/multiSend', () => ({
  ...jest.requireActual('@safe-global/utils/utils/multiSend'),
  multiSendDefaultsToSelf: jest.fn(),
}))

const safeInterface = Safe__factory.createInterface()
const encodeEnableModule = (module: string) => safeInterface.encodeFunctionData('enableModule', [module])

const buildMultisendTxData = (innerTxs: Array<{ to: string; module: string }>) => ({
  to: { value: faker.finance.ethereumAddress() },
  value: '0',
  operation: Operation.DELEGATE,
  addressInfoIndex: {},
  dataDecoded: {
    method: 'multiSend',
    parameters: [
      {
        name: 'transactions',
        type: 'bytes',
        value: '0x',
        valueDecoded: innerTxs.map(({ to, module }) => ({
          operation: Operation.CALL,
          to,
          value: '0',
          data: encodeEnableModule(module),
          dataDecoded: {
            method: 'enableModule',
            parameters: [{ name: 'module', type: 'address', value: module }],
          },
        })),
      },
    ],
  },
})

describe('Multisend', () => {
  const safeAddress = faker.finance.ethereumAddress()

  beforeEach(() => {
    ;(useSafeAddress as jest.Mock).mockReturnValue(safeAddress)
    // Default: the batch's MultiSend version defaults a zero `to` to the Safe (v1.5.0+)
    ;(multiSendDefaultsToSelf as jest.Mock).mockReturnValue(true)
  })

  it('resolves a zero-address inner action to the Safe (MultiSend v1.5.0+ defaults `to` to address(this))', () => {
    const moduleAddress = faker.finance.ethereumAddress()
    const result = render(<Multisend txData={buildMultisendTxData([{ to: ZERO_ADDRESS, module: moduleAddress }])} />)

    fireEvent.click(result.getByTestId('expande-all-btn'))

    // The action is shown as targeting the Safe, not a bare call to the zero address
    expect(result.getByText('This Safe Account')).toBeInTheDocument()
    expect(result.queryByText('0x0000...0000')).not.toBeInTheDocument()
  })

  it('leaves a non-zero inner action target unchanged', () => {
    const contract = faker.finance.ethereumAddress()
    const moduleAddress = faker.finance.ethereumAddress()
    const result = render(<Multisend txData={buildMultisendTxData([{ to: contract, module: moduleAddress }])} />)

    fireEvent.click(result.getByTestId('expande-all-btn'))

    // A real target is not rewritten to the Safe
    expect(result.queryByText('This Safe Account')).not.toBeInTheDocument()
  })

  it('does NOT resolve the zero address for a pre-1.5.0 MultiSend (keeps the raw zero address)', () => {
    // Older MultiSend versions call the zero address as-is — no zero->Safe default
    ;(multiSendDefaultsToSelf as jest.Mock).mockReturnValue(false)
    const moduleAddress = faker.finance.ethereumAddress()
    const result = render(<Multisend txData={buildMultisendTxData([{ to: ZERO_ADDRESS, module: moduleAddress }])} />)

    fireEvent.click(result.getByTestId('expande-all-btn'))

    expect(result.getByText('0x0000...0000')).toBeInTheDocument()
    expect(result.queryByText('This Safe Account')).not.toBeInTheDocument()
  })

  it('resolves a zero-address inner action to the executing Safe when overridden (nested Safe)', () => {
    // Nested Safe: the batch executes in a different Safe than the connected one
    const nestedSafe = faker.finance.ethereumAddress()
    const moduleAddress = faker.finance.ethereumAddress()
    const result = render(
      <Multisend
        txData={buildMultisendTxData([{ to: ZERO_ADDRESS, module: moduleAddress }])}
        executingSafeAddress={nestedSafe}
      />,
    )

    fireEvent.click(result.getByTestId('expande-all-btn'))

    // Resolves to the nested Safe, not the connected one ("This Safe Account" is the connected Safe)
    expect(result.queryByText('This Safe Account')).not.toBeInTheDocument()
    expect(result.queryByText('0x0000...0000')).not.toBeInTheDocument()
  })
})
