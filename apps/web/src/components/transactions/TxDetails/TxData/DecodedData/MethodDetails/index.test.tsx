import type { DataDecoded, DataDecodedParameter } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { render, screen } from '@/tests/test-utils'
import { basicTypesActions, HUGE_UINT } from '@/tests/builders/dataDecoded'
import { MethodDetails } from '.'

// Malformed values are what these tests feed in, so they are wider than the generated type
const withParameter = (type: string, value: unknown): DataDecoded => ({
  method: 'testMethod',
  parameters: [{ name: 'newValue', type, value: value as DataDecodedParameter['value'] }],
})

const leaves = (value: unknown): string[] => (Array.isArray(value) ? value.flatMap(leaves) : [String(value)])

// Addresses and bytes are shortened or split across elements, so only plain values are matched exactly
const plainValues = ({ parameters }: DataDecoded): string[] =>
  (parameters ?? [])
    .filter(({ type }) => !/^(address|bytes|tuple)/.test(type))
    .flatMap(({ value }) => leaves(value))
    .filter((leaf) => leaf !== '')

describe('MethodDetails', () => {
  it.each(basicTypesActions().map(({ dataDecoded }) => [dataDecoded.method, dataDecoded]))(
    'renders the parameters of %s',
    (_, data) => {
      render(<MethodDetails data={data} />)

      ;(data.parameters ?? []).forEach(({ name }) => {
        expect(screen.getByText(name)).toBeInTheDocument()
      })
      plainValues(data).forEach((value) => {
        expect(screen.getAllByText(value)[0]).toBeInTheDocument()
      })
    },
  )

  it('shows the exact digits of a huge integer in an array', () => {
    render(<MethodDetails data={withParameter('uint256[]', [HUGE_UINT])} />)

    expect(screen.getByText(HUGE_UINT)).toBeInTheDocument()
  })

  it('shows a stringified array with a huge integer as the raw string', () => {
    render(<MethodDetails data={withParameter('uint256[]', `[${HUGE_UINT}]`)} />)

    expect(screen.getByText(`[${HUGE_UINT}]`)).toBeInTheDocument()
  })

  it.each([
    ['numbers in a stringified array', 'int8[]', '[1,-2,3]', '-2'],
    ['booleans in a stringified array', 'bool[]', '[true,false]', 'false'],
    ['a stringified number for an array type', 'uint256[]', '123', '123'],
    ['an array of numbers', 'uint8[]', [1, 7], '7'],
    ['an array with null', 'string[]', ['a', null], 'null'],
    ['a boolean', 'bool', true, 'true'],
    ['a number', 'uint256', 7, '7'],
    ['an object', 'tuple', { name: 'hola' }, '{"name":"hola"}'],
  ])('renders %s as text', (_, type, value, expectedText) => {
    render(<MethodDetails data={withParameter(type, value)} />)

    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it('hides a parameter without a value', () => {
    render(<MethodDetails data={withParameter('string', null)} />)

    expect(screen.queryByText('newValue')).not.toBeInTheDocument()
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })
})
