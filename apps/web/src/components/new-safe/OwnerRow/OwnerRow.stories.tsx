import type { Meta, StoryObj } from '@storybook/react'
import type { ReactElement, ReactNode } from 'react'
import { mswLoader } from 'msw-storybook-addon'
import { FormProvider, useForm } from 'react-hook-form'
import { createMockStory } from '@/stories/mocks'
import OwnerRow from './index'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/new-safe/create',
  shadcn: true,
})

const FormWrapper = ({ children }: { children: ReactNode }): ReactElement => {
  const methods = useForm({
    defaultValues: { owners: [{ name: '', address: '' }] },
  })
  return <FormProvider {...methods}>{children}</FormProvider>
}

const meta = {
  title: 'Components/NewSafe/OwnerRow',
  component: OwnerRow,
  loaders: [mswLoader],
  decorators: [
    (Story) => (
      <FormWrapper>
        <Story />
      </FormWrapper>
    ),
    defaultSetup.decorator,
  ],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
  args: { index: 0, groupName: 'owners' },
} satisfies Meta<typeof OwnerRow>

export default meta

type Story = StoryObj<typeof meta>

/** Editable row. The delete button is centred on the 66px field boxes, not on the whole grid cell. */
export const Default: Story = {
  args: { remove: () => {} },
}

/** Last remaining signer — the row keeps its columns but drops the delete button. */
export const NotRemovable: Story = {
  args: { removable: false },
}

/** Read-only variant used once the Safe exists: the address becomes a plain readout. */
export const ReadOnly: Story = {
  args: { readOnly: true },
}
