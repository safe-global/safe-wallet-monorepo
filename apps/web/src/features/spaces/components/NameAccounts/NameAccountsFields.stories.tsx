import type { Meta, StoryObj } from '@storybook/react'
import type { ReactElement } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { withMockProvider } from '@/storybook/preview'
import type { AllSafeItems } from '@/hooks/safes'
import type { AddAccountsFormValues } from '../../hooks/addAccounts.types'
import NameAccountsFields from './NameAccountsFields'

/** Supplies the form context the fields read through useFormContext. */
const withForm = (Story: () => ReactElement) => {
  const Wrapper = () => {
    const methods = useForm<AddAccountsFormValues>({
      mode: 'onChange',
      defaultValues: { selectedSafes: {}, names: {} },
    })
    return <FormProvider {...methods}>{Story()}</FormProvider>
  }
  return <Wrapper />
}

const meta = {
  title: 'Features/Spaces/NameAccountsFields',
  component: NameAccountsFields,
  decorators: [withForm, withMockProvider()],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof NameAccountsFields>

export default meta
type Story = StoryObj<typeof meta>

const items: AllSafeItems = [
  {
    name: undefined,
    address: '0xfaff021e5c8db53923e08576153191b9a42ccb7a',
    chainId: '1',
    isPinned: true,
    isReadOnly: false,
    lastVisited: 0,
  },
  {
    name: 'Cats',
    address: '0x2931458542fEE9878fdb5a4F60E178EdC9580b76',
    isPinned: true,
    lastVisited: 0,
    safes: [
      {
        name: 'Cats',
        address: '0x2931458542fEE9878fdb5a4F60E178EdC9580b76',
        chainId: '1',
        isPinned: true,
        isReadOnly: false,
        lastVisited: 0,
      },
      {
        name: 'Cats',
        address: '0x2931458542fEE9878fdb5a4F60E178EdC9580b76',
        chainId: '137',
        isPinned: true,
        isReadOnly: false,
        lastVisited: 0,
      },
    ],
  },
]

/** One row per Safe. The second is a multichain Safe with a local name prefilled. */
export const Default: Story = { args: { items } }
