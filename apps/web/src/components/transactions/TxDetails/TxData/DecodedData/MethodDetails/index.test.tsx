import type { DataDecoded, DataDecodedParameter } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { render, screen } from '@/tests/test-utils'
import { basicTypesActions, HUGE_UINT } from '@/tests/builders/dataDecoded'
import { MethodDetails } from '.'

const withParameter = (type: string, value: unknown): DataDecoded => ({
  method: 'testMethod',
  parameters: [{ name: 'newValue', type, value: value as DataDecodedParameter['value'] }],
})

describe('MethodDetails', () => {
  it.each(basicTypesActions().map(({ dataDecoded }) => [dataDecoded!.method, dataDecoded!]))(
    'renders every parameter of %s',
    (_, data) => {
      render(<MethodDetails data={data} />)

      data.parameters!.forEach(({ name }) => {
        expect(screen.getAllByText(name).length).toBeGreaterThan(0)
      })
    },
  )

  it('shows the exact digits of a huge integer in an array', () => {
    const { container } = render(<MethodDetails data={withParameter('uint256[]', [HUGE_UINT])} />)

    expect(container).toHaveTextContent(HUGE_UINT)
  })

  it('shows the exact digits of a huge integer in a stringified array', () => {
    const { container } = render(<MethodDetails data={withParameter('uint256[]', `[${HUGE_UINT}]`)} />)

    expect(container).toHaveTextContent(HUGE_UINT)
  })

  it.each([
    ['numbers in a stringified array', 'int8[]', '[1,-2,3]', '-2'],
    ['booleans in a stringified array', 'bool[]', '[true,false]', 'false'],
    ['a stringified number for an array type', 'uint256[]', '123', '123'],
    ['an array of numbers', 'uint8[]', [1, 2], '2'],
    ['an array with null', 'string[]', ['a', null], 'null'],
    ['a boolean', 'bool', true, 'true'],
    ['a number', 'uint256', 5, '5'],
    ['an object', 'tuple', { name: 'hola' }, 'hola'],
  ])('renders %s as text', (_, type, value, expectedText) => {
    const { container } = render(<MethodDetails data={withParameter(type, value)} />)

    expect(container).toHaveTextContent(expectedText)
  })

  it('renders a null value without crashing', () => {
    expect(() => render(<MethodDetails data={withParameter('string', null)} />)).not.toThrow()
  })
})
