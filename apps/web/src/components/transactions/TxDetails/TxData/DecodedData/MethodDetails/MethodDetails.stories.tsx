import type { Meta, StoryObj } from '@storybook/react'
import { faker } from '@faker-js/faker'
import type { DataDecoded, DataDecodedParameter } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { createMockStory } from '@/stories/mocks'
import { basicTypesActions, HUGE_UINT } from '@/tests/builders/dataDecoded'
import { MethodDetails } from '.'

faker.seed(1001)

const setup = createMockStory({ shadcn: true })

const actions = basicTypesActions()

// Malformed values are the point of this story, so they are wider than the generated type
const parameter = (type: string, value: unknown): DataDecodedParameter => ({
  name: type,
  type,
  value: value as DataDecodedParameter['value'],
})

const malformedValues: DataDecoded = {
  method: 'malformedValues',
  parameters: [
    parameter('uint256', 7),
    parameter('bool', true),
    parameter('tuple', { name: 'hola', age: 12 }),
    parameter('int8[]', '[1,-2,3]'),
    parameter('uint256[]', `[${HUGE_UINT}]`),
    parameter('string[]', ['a', null]),
    parameter('bool[][][2]', [[[]], [[true], [false]]]),
  ],
}

const meta = {
  title: 'Components/Transactions/MethodDetails',
  component: MethodDetails,
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
  args: {
    data: actions[0].dataDecoded,
  },
} satisfies Meta<typeof MethodDetails>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Every call of the Transaction Builder batch QA uses to cover all ABI types. */
export const AllAbiTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {actions.map(({ dataDecoded }) => (
        <section key={dataDecoded.method} className="flex flex-col gap-2">
          <h3 className="font-semibold">{dataDecoded.method}</h3>
          <MethodDetails data={dataDecoded} />
        </section>
      ))}
    </div>
  ),
}

/** Values the decoder should never send, rendered as text instead of crashing. */
export const MalformedValues: Story = {
  args: {
    data: malformedValues,
  },
}
